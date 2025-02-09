/* eslint-disable no-console */
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { Button, Input, Row, Checkbox, Drawer, Tooltip, Form, Collapse } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { cloneDeep, get, throttle, uniqueId } from 'lodash';
import { graphToSimpleTree, safetyParseJSON, treeToGraph } from '../utils';
import { useEditor } from '../use-editor';
import { RespondingStatus, useLLMStreamCall } from '../use-llm-stream-call';
import { SimpleTreeNode } from '../types';
import { ChatMessages, Message } from '@/components/message-bubble';
import { InfoCircleFilled } from '@ant-design/icons';

const defaultModalName = 'gemma2:2b'; // 'gemma2:2b' 'deepseek-r1:1.5b' 'deepseek-coder:1.3b'

const tips = `使用说明: 这里的模型名称来自于本地Ollama部署的模型名称, 请在Ollama中部署好模型后再使用。安装方法可参考：https://ollama.com`;


const getSystemPrompt = ({ beauty = false, rootNode }: {
  query: string;
  beauty?: boolean;
  rootNode?: SimpleTreeNode;
}) => `
# 角色:
你是一名思维导图数据生成器。能够根据用户输入的需求生成符合格式要求的思维导图json数据。

## 输出格式约束:
1. 输出格式非常重要, 请务必保证输出格式为合法的单个根节点树状JSON对象数据格式, 所有节点数据都在一棵树内, 每个节点都必须遵循如下 MindNode 接口定义。
2. 无需包含额外的注释或说明, 只需要输出JSON数据${beauty ? ', json数据需要空格格式化' : ', json数据不需要空格格式化, 直接在一行输出即可'}。

\`\`\`typescript
interface MindNode {
// 节点的名字，必须有
label: string; 
// 可选的子节点列表, 若没有子节点则不需要children字段
children?: MindNode[];
}
\`\`\`

## 示例:
用户输入：生成高中理科科目思维导图
你的输出：
\`\`\`json
${JSON.stringify({"label":"高中科目","children":[{"label":"数学"},{"label":"语文"},{"label":"英语"},{"label":"物理"},{"label":"化学"},{"label":"生物"}]}, null, beauty ? 2 : undefined)}
\`\`\`

${rootNode ? `请根据原始的数据进行修改: \`\`\`json\n${JSON.stringify(rootNode)}\n\`\`\`` : ''}

`;

const getExpandPrompt = ({ beauty, node, rootNode }: {
  query: string;
  beauty?: boolean;
  node: { label: string; id: string; };
  rootNode: SimpleTreeNode;
}) => `
# 角色:
你是一名思维导图数据生成器。能够根据用户输入的需求生成符合格式要求的思维导图json数据。

## 输出格式约束:
1. 输出格式非常重要, 请务必保证输出格式为合法的单个根节点树状JSON对象数据格式, 所有节点数据都在一棵树内, 每个节点都必须遵循如下 MindNode 接口定义。
2. 无需包含额外的注释或说明, 只需要输出JSON数据${beauty ? ', json数据需要空格格式化' : ', json数据不需要空格格式化, 直接在一行输出即可'}。

\`\`\`typescript
interface MindNode {
// 节点的名字，必须有
label: string; 
// 可选的子节点列表, 若没有子节点则不需要children字段
children?: MindNode[];
}
\`\`\`

## 要求
- 你需要充分理解整体思维导图的数据上下文语义, 推导扩写节点label=${node.label},id=${node.id}的子节点,  分析扩展生成目标「${node.label}」节点下的内容并转化为思维导图树的数据。
- 仅生成一个以节点label=${node.label}为根节点的局部思维导图，也就是推理扩展完整思维导图的一颗子树, 不需要包含原始思维导图的其他数据。

原始思维导图整体数据为：
\`\`\`json
${JSON.stringify(rootNode, null, beauty ? 2 : undefined)}
\`\`\`

你需要在Markdown中仅输出「${node.label}」节点扩展出子节点的思维导图json数据.
`;

function resetChildrenNodeId(tree: SimpleTreeNode) {
  const dfs = (node: SimpleTreeNode) => {
    node.id = uniqueId();
    node.children?.forEach(dfs);
  };
  // 根节点不重置
  tree.children?.forEach(dfs);
  return tree;
}


function getJsonDataFromMarkdown(markdown: string) {
  if (markdown.indexOf('```json') >= 0) {
    const json =
      markdown
        .split('```json')[1]
        ?.split('```')?.[0]
        ?.replace('```', '')
        ?.trim() ?? '';
    return json;
  }
  if (markdown.indexOf('```\n') >= 0) {
    const json =
      markdown
        .split('```\n')[1]
        ?.split('```')?.[0]
        ?.replace('```', '')
        ?.trim() ?? '';
    return json;
  }
  return markdown;
}

const example = `生成一个语数英理化生简单科目的思维导图(共10个节点以内)`;


interface ApiConfig {
  modelName?: string;
  url: string;
  response_path?: string;
}
function APiConfigForm({ initialValues, onChange }: {
  initialValues?: ApiConfig;
  onChange: (values: ApiConfig) => void;
}) {
  const [form] = Form.useForm();

  return (
    <Form
      size="small"
      form={form}
      onValuesChange={(val, values) => onChange(values)}
      initialValues={initialValues}
    >
      <Form.Item
        label="接口(url)"
        name="url"
        rules={[{ required: true, message: '请输入接口 URL' }]}
      >
        <Input placeholder="请输入接口 URL" />
      </Form.Item>
      <Form.Item
        label="模型名"
        name="modelName"
      >
        <Input placeholder="请输入模型名" />
      </Form.Item>
      <Form.Item
        label="Response路径"
        name="response_path"
      >
        <Input placeholder="请输入 Response 路径" />
      </Form.Item>
    </Form>
  );
};

export function AIPanel() {
  const flow = useReactFlow();
  const { fitView } = flow;
  const { layout, selection, setData, computeLayout } = useEditor();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState(example);
  const [regenerate, setRegenerate] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: '让我们一起来制作一个思维导图吧' }]);
  const [mode, setMode] = useState<'generate' | 'expand'>('generate');
  const [apiConfig, setApiConfig] = useState<ApiConfig>(
    safetyParseJSON(localStorage.getItem('mind_map_api_config') ?? '') ?? {
    modelName: 'deepseek-r1:1.5b',
    // url: http://localhost:3000/api/fe-plugin/mind-map-gen-stream
    url: 'http://localhost:11434/api/generate',
    response_path: 'response',
  })
  // const { smoothExecuteResult, start, abort, respondingStatus } =
  //   useLLMStreamCall();
  const aiLLMCall = useLLMStreamCall();
  const expandLLMCall = useLLMStreamCall();
  const backupDataRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const selectedNodeRef = useRef<Node | undefined>();

  const render = throttle(str => {
    try {
      const jsonStr = jsonrepair(str);
      const treeData = resetChildrenNodeId(JSON.parse(jsonStr));
      const graphData = treeToGraph(treeData);
      const layoutGraph = computeLayout(
        layout,
        graphData.nodes,
        graphData.edges,
      );
      setData(layoutGraph.nodes, layoutGraph.edges);
      window.requestAnimationFrame(() => {
        fitView();
      });
    } catch (e) {
      console.error(e);
    }
  }, 200);


  const responseTransform = (chunk: string) => {
    if (!apiConfig.response_path) {
      return chunk;
    }
    try {
      const res = JSON.parse(chunk.toString());
      return get(res, apiConfig.response_path ?? '');
    } catch (e) {
      return '';
    }
  }

  const renderExpand = throttle(str => {
    try {
      const jsonStr = jsonrepair(str);
      const treeData = resetChildrenNodeId(JSON.parse(jsonStr));
      treeData.id = selectedNodeRef.current?.id ?? '';

      const graphData = treeToGraph(treeData);
      const rootID = selectedNodeRef.current?.id;
      graphData.nodes = graphData.nodes.filter(e => e.id !== rootID);
      const layoutGraph = computeLayout(
        layout,
        [...backupDataRef.current.nodes, ...graphData.nodes],
        [...backupDataRef.current.edges, ...graphData.edges],
      );
      setData(layoutGraph.nodes, layoutGraph.edges);
      window.requestAnimationFrame(() => {
        fitView();
      });
    } catch (e) {
      console.log(str);
      console.error(e);
    }
  }, 200);


  const handleGenerate = () => {
    const treeData = graphToSimpleTree(flow.getNodes(), flow.getEdges());
    setMode('generate');
    const systemPrompt = getSystemPrompt({ beauty: true, query, rootNode: regenerate ? undefined : treeData });
    const queryStr = `现在开始，用户的输入为：${query}\n你的输出: `;
    aiLLMCall.start({
      url: apiConfig.url,
      method: 'POST',
      body: JSON.stringify({
        prompt: `${systemPrompt}\n${queryStr}`,
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: queryStr },
        ],
        model: apiConfig.modelName,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
      responseTransform,
    });
    setMessages((oldState) => [
      ...oldState.slice(0, 1),
      { role: 'user', content: query },
    ]);
    setQuery('');
  };

  const handleExpandChild = () => {
    selectedNodeRef.current = selection.nodes[0];
    if (!selectedNodeRef.current) {
      return;
    }
    setMode('expand');
    const data = {
      nodes: flow.getNodes(),
      edges: flow.getEdges(),
    };
    backupDataRef.current = cloneDeep(data);
    const rootNode = graphToSimpleTree(data.nodes, data.edges);
    const systemPrompt = getExpandPrompt({
      query,
      node: { label: selectedNodeRef.current?.data?.label as string ?? '', id: selectedNodeRef.current?.id ?? '' },
      rootNode,
    });
    const queryStr = query ? `现在开始，用户的输入为：${query}\n你的输出: ` : '';
    expandLLMCall.start({
      url: apiConfig.url,
      method: 'POST',
      body: JSON.stringify({
        prompt: `${systemPrompt}\n${queryStr}`,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: queryStr },
        ],
        model: apiConfig.modelName,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
      responseTransform,
    });
    setMessages((oldState) => [
      ...oldState.slice(0, 1),
      { role: 'user', content: query },
    ]);
    setQuery('');
  };

  useEffect(() => {
    if (aiLLMCall.smoothExecuteResult) {
      setMessages((oldState) => [
        ...oldState.slice(0, 2),
        {
          role: 'assistant',
          content: aiLLMCall.smoothExecuteResult,
        },
      ]);
    }
    const json = getJsonDataFromMarkdown(aiLLMCall.smoothExecuteResult);
    if (!json?.trim()) {
      console.log('json内容为空', aiLLMCall.smoothExecuteResult);
      return;
    }
    render(json);
  }, [aiLLMCall.smoothExecuteResult]);

  useEffect(() => {
    if (expandLLMCall.smoothExecuteResult) {
      setMessages((oldState) => [
        ...oldState.slice(0, 2),
        {
          role: 'assistant',
          content: expandLLMCall.smoothExecuteResult,
        },
      ]);
    }
    const json = getJsonDataFromMarkdown(expandLLMCall.smoothExecuteResult);
    if (!json?.trim()) {
      console.log('json内容为空', expandLLMCall.smoothExecuteResult);
      return;
    }
    renderExpand(json);
  }, [expandLLMCall.smoothExecuteResult]);

  useEffect(() => {
    if (aiLLMCall.respondingStatus === RespondingStatus.End) {
      setTimeout(() => {
        fitView();
      }, 200);
    }
  }, [aiLLMCall.smoothExecuteResult]);
  return (
    <>
      <Button size='small' onClick={() => setVisible(true)}>AI</Button>
      <Drawer
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          AI生成 
          <Tooltip title={tips}><InfoCircleFilled style={{ fontSize: 12, color: '#999' }} /></Tooltip>
        </div>}
        width={500}
        visible={visible}
        mask={false}
        onClose={() => setVisible(false)}
        bodyStyle={{ padding: 12 }}>
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            padding: 8,
            flexGrow: 1,
            fontSize: 13,
          }}>
            <ChatMessages
              messages={messages}
            />
          </div>
          <Collapse>
            <Collapse.Panel header="更多配置(模型 / 接口)" key="1">
              <APiConfigForm
                initialValues={apiConfig}
                onChange={(values) => {
                  setApiConfig(values);
                  localStorage.setItem('mind_map_api_config', JSON.stringify(values))
                }}
              />
            </Collapse.Panel>
          </Collapse>
          <Input.TextArea
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ minHeight: 100 }}
            placeholder="请输入你的需求，例如：生成一个中国八大菜系的思维导图吧"
          />

          <Row style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              disabled={expandLLMCall.respondingStatus === RespondingStatus.Starting || !query.trim()}
              loading={aiLLMCall.respondingStatus === RespondingStatus.Starting}
              onClick={handleGenerate}>
              生成
            </Button>
            <Button
              type="primary"
              disabled={aiLLMCall.respondingStatus === RespondingStatus.Starting || selection.nodes.length !== 1}
              loading={expandLLMCall.respondingStatus === RespondingStatus.Starting}
              onClick={handleExpandChild}>
              扩写
            </Button>
            <Button onClick={() => {
              aiLLMCall.abort();
              expandLLMCall.abort();
            }}>
              停止
            </Button>
            {/* <Checkbox
              checked={regenerate}
              onChange={e => setRegenerate(e.target.checked)}
            >
              重新生成
            </Checkbox> */}
          </Row>
        </div>
      </Drawer>
    </>
  );
}
