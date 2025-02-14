/* eslint-disable no-console */
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { Button, Input, Row, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { cloneDeep, get, throttle } from 'lodash';
import { graphToSimpleTree, safetyParseJSON, treeToGraph } from '../../utils';
import { useEditor } from '../../use-editor';
import { RespondingStatus, useLLMStreamCall } from '../../use-llm-stream-call';
import { ChatMessages, Message } from '@/components/message-bubble';
import { InfoCircleFilled } from '@ant-design/icons';
import { ApiConfig, APiConfigFormCollapse, getLLMCallParams, LLMApiConfig, LLMProviderType } from './api-config-form';
import { ExpandAction, getJsonDataFromMarkdown, MagicAIAction, resetChildrenNodeId } from './helper';
import { getExpandPrompt, getSystemPrompt } from './prompt';
import { MarkdownBox } from '@/components/markdown-box';

const tips = (
  <MarkdownBox
    markdown={`
AI使用说明(免费使用AI大模型攻略):
1. **方法一**: 本地Ollama部署的模型名称, 请在Ollama中部署好模型后再使用。安装方法可参考：https://ollama.com;
2. **方法二**: 硅基流动部分模型可以免费调用(如qwen2.5) 在官网 https://siliconflow.cn 注册登录后到【API密钥】菜单创建一个密钥填写在下方接口配置处即可免费使用;
3. **方法三**: 本地API: 如果你是开发者, 可以调用本地服务的API来使用;
`}
  />
);


const example = `生成一个初中物理知识的简易思维导图`;

export function AIPanel() {
  const flow = useReactFlow();
  const { fitView } = flow;
  const { layout, selection, setData, computeLayout } = useEditor();
  const [visible, setVisible] = useState(localStorage.getItem('mind_map_open_ai_panel') === 'true');
  const [query, setQuery] = useState(example);
  const [regenerate, setRegenerate] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: '让我们一起来制作一个思维导图吧' }]);
  const [mode, setMode] = useState<'generate' | 'expand'>('generate');
  const [apiConfig, setApiConfig] = useState<LLMApiConfig>(
    safetyParseJSON(localStorage.getItem('mind_map_api_config') ?? '') ?? {
      provider: LLMProviderType.OLLAMA,
      config: {
        modelName: 'deepseek-r1:1.5b',
        stream: true,
      },
    })
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

    aiLLMCall.start(
      getLLMCallParams(apiConfig)({
        prompt: `${systemPrompt}\n${queryStr}`,
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: queryStr },
        ],
      }),
    );
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
    expandLLMCall.start(
      getLLMCallParams(apiConfig)({
        prompt: `${systemPrompt}\n${queryStr}`,
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: queryStr },
        ],
      }),
    );
    setMessages((oldState) => [
      ...oldState.slice(0, 1),
      { role: 'user', content: query || '扩写选中节点' },
    ]);
    setQuery('');
  };

  const handleOpenAIPanel = (open: boolean) => {
    setVisible(open);
    localStorage.setItem('mind_map_open_ai_panel', open ? 'true' : 'false');
  };

  useEffect(() => {
    const result = aiLLMCall.smoothExecuteResult;
    if (result) {
      const isJson = !result.includes('```json') && result.trim().startsWith('{');
      setMessages((oldState) => [
        ...oldState.slice(0, 2),
        {
          role: 'assistant',
          content: !isJson ? result : `\`\`\`json\n${result}\n\`\`\``,
        },
      ]);
    }
    const json = getJsonDataFromMarkdown(result);
    if (!json?.trim()) {
      console.log('json内容为空', result);
      return;
    }
    render(json);
  }, [aiLLMCall.smoothExecuteResult]);

  useEffect(() => {
    const result = expandLLMCall.smoothExecuteResult;
    if (result) {
      const isJson = !result.includes('```json') && result.trim().startsWith('{');
      setMessages((oldState) => [
        ...oldState.slice(0, 2),
        {
          role: 'assistant',
          content: !isJson ? result : `\`\`\`json\n${result}\n\`\`\``,
        },
      ]);
    }
    const json = getJsonDataFromMarkdown(result);
    if (!json?.trim()) {
      console.log('json内容为空', result);
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
  if (!visible) {
    return <div style={{ width: 0, position: 'relative'}}>
      <MagicAIAction visible={visible} setVisible={handleOpenAIPanel} />
    </div>
  }
  return (
    <div style={{
      height: '100%', width: 460,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #f0f0f0',
        padding: 12,
        fontSize: 16,
        fontWeight: 'bold',
      }}>
        <ExpandAction visible={visible} setVisible={handleOpenAIPanel} />
        <MagicAIAction visible={visible} setVisible={handleOpenAIPanel} />
        AI生成 
        <Tooltip title={tips}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#999' }}>
            <InfoCircleFilled /> 使用说明
          </div>
        </Tooltip>
      </div>
      <div style={{
        overflow: 'hidden',
        padding: 12, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: 8,
          flexGrow: 1,
          fontSize: 13,
        }}>
          <ChatMessages
            messages={messages}
          />
        </div>
        <APiConfigFormCollapse
          values={apiConfig}
          onChange={(values) => {
            setApiConfig(values);
            localStorage.setItem('mind_map_api_config', JSON.stringify(values))
          }}
        />
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
    </div>
  );
}
