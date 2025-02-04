/* eslint-disable no-console */
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { Button, Popover, Input, Divider, Row, Checkbox } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { chunk, cloneDeep, throttle, uniqueId } from 'lodash';
import { graphToSimpleTree, treeToGraph } from '../utils';
import { useEditor } from '../use-editor';
import { RespondingStatus, useLLMStreamCall } from '../use-llm-stream-call';
import { SimpleTreeNode } from '../types';
import { ChatMessages } from '@/components/message-bubble';
import { mockAIRes } from './mock';

const modalName = 'gemma2:2b'; // 'deepseek-r1:1.5b'

const responseTransform = (chunk: string) => {
  try {
    const res = JSON.parse(chunk.toString());
    return res?.response ?? '';
  } catch (e) {
    return '';
  }
}

const systemPrompt = `
# 角色:
你是一名思维导图数据生成器。

## 目标:
- 生成结构化的思维导图数据。
- 确保数据遵循给定的格式和类型要求。

## 技能:
- 理解和应用数据结构知识。
- 能够根据用户需求生成具体的数据节点。

## 工作流程:
1. 解析用户输入的思维导图主题和子节点信息。
2. 根据解析结果，构建符合 \`MindNode\` 接口的数据结构。
3. 确保每个节点正确地链接其子节点，并验证数据的完整性和准确性。
4. 输出最终的 JSON 格式的思维导图数据。

## 输出格式:
输出应为 JSON 格式，遵循 \`MindNode\` 接口定义，包括节点的标签（label）和可选的子节点（children）列表。样式应保持清晰和专业。
\`\`\`ts
// MindNode 接口定义
interface MindNode {
  label: string;
  children?: MindNode[];
}
\`\`\`

## 约束:
- 必须使用 JSON 格式输出思维导图数据。
- 所有节点必须严格符合 \`MindNode\` 接口定义。
- 仅返回 JSON 数据，无需额外的解释或说明。

## 示例:
输入（用户的要求）：生成高中理科科目思维导图
输出(返回输出内容)：
\`\`\`json
{"label":"初中科目","children":[{"label":"数学"},{"label":"语文"},{"label":"英语"},{"label":"物理"},{"label":"化学"}}
\`\`\`
`

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
  if (markdown.indexOf('```') >= 0) {
    const json =
      markdown
        .split('```json')[1]
        ?.split('```')?.[0]
        ?.replace('```', '')
        ?.trim() ?? '';
    return json;
  }
  return markdown;
}

const example = `生成一个语数英理化生简单科目的思维导图(共10个节点以内)`;

export function ExpandNodeChildren() {
  const flow = useReactFlow();
  const { fitView } = flow;
  const { layout, selection, setData, computeLayout, updateLayout } =
    useEditor();
  const [userQuery, setUserQuery] = useState('');
  const { smoothExecuteResult, start, abort, respondingStatus } =
    useLLMStreamCall();
  const backupDataRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const selectedNodeRef = useRef<Node | undefined>();

  const render = throttle(str => {
    try {
      const jsonStr = jsonrepair(str);
      const treeData = resetChildrenNodeId(JSON.parse(jsonStr));
      console.log('treeData', treeData);
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
    selectedNodeRef.current = selection.nodes[0];
    if (!selectedNodeRef.current) {
      return;
    }
    const data = {
      nodes: flow.getNodes(),
      edges: flow.getEdges(),
    };
    backupDataRef.current = cloneDeep(data);
    const jsonData = JSON.stringify(graphToSimpleTree(data.nodes, data.edges));
    const userQueryStr = userQuery ? `\n\n要求: ${userQuery}\n` : '';
    const query = `${systemPrompt}
      要求：请根据整体思维导图的数据，扩写节点id=${selectedNodeRef.current.id}的子节点。
      直接生成一个以节点id=${selectedNodeRef.current.id}为根节点的独立思维导图。
      ${userQueryStr}
      \`\`\`json${jsonData}\n\`\`\``;
    start({
      url: `http://localhost:11434/api/generate`,
      method: 'POST',
      body: JSON.stringify({
        prompt: query,
        model: modalName,
      }),
      responseTransform,
    });
  };

  useEffect(() => {
    const json = getJsonDataFromMarkdown(smoothExecuteResult);
    if (!json?.trim()) {
      console.log('json内容为空', smoothExecuteResult);
      return;
    }
    render(json);
  }, [smoothExecuteResult]);

  useEffect(() => {
    if (respondingStatus === RespondingStatus.End) {
      console.log('yf123 result', smoothExecuteResult);
      setTimeout(() => {
        updateLayout();
        window.requestAnimationFrame(() => {
          fitView();
        });
      }, 200);
    }
  }, [RespondingStatus, smoothExecuteResult]);
  const loading = respondingStatus === RespondingStatus.Starting;

  return (
    <Popover
      trigger="click"
      content={
        <div style={{ width: 400 }}>
          选中一个节点点击扩写
          <Row>
            <Button
              disabled={selection.nodes.length !== 1}
              size="small"
              loading={loading}
              onClick={handleGenerate}
            >
              扩写
            </Button>
            <Button
              disabled={!loading}
              size="small"
              style={{ marginLeft: 8 }}
              onClick={() => abort()}
            >
              停止
            </Button>
          </Row>
          <Divider />
          <Input.TextArea
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            style={{ minHeight: 200 }}
          />
        </div>
      }
    >
      <Button size="small">AI扩写</Button>
    </Popover>
  );
}

export function AIPanel() {
  const flow = useReactFlow();
  const { fitView } = flow;
  const { layout, setData, computeLayout } = useEditor();
  const [query, setQuery] = useState(example);
  const [regenerate, setRegenerate] = useState(true);
  const { smoothExecuteResult, start, abort, respondingStatus } =
    useLLMStreamCall();

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
      console.log(str);
    }
  }, 200);

  const handleGenerate = () => {
    const treeData = graphToSimpleTree(flow.getNodes(), flow.getEdges());
    const contextData = regenerate
      ? ''
      : `\n\n根据如下数据修改: \`\`\`json
    ${JSON.stringify(treeData)}
    \`\`\``;
    const queryStr = `${systemPrompt}\n\n${query}${contextData}`;
    start({
      url: `http://localhost:11434/api/generate`,
      method: 'POST',
      body: JSON.stringify({
        prompt: queryStr,
        model: modalName,
      }),
      responseTransform,
    });
  };

  useEffect(() => {
    const json = getJsonDataFromMarkdown(smoothExecuteResult);
    if (!json?.trim()) {
      console.log('json内容为空', smoothExecuteResult);
      return;
    }
    render(json);
  }, [smoothExecuteResult]);

  useEffect(() => {
    if (respondingStatus === RespondingStatus.End) {
      console.log('yf123 result', smoothExecuteResult);
      setTimeout(() => {
        fitView();
      }, 200);
    }
  }, [RespondingStatus, smoothExecuteResult]);
  const loading = respondingStatus === RespondingStatus.Starting;

  return (
    <Popover
      trigger="click"
      content={
        <div style={{ width: 600 }}>
          <Row style={{ display: 'flex', gap: 12 }}>
            <Button size="small" loading={loading} onClick={handleGenerate}>
              开始生成
            </Button>
            <Button size="small" onClick={() => abort()}>
              停止
            </Button>
            <Checkbox
              checked={regenerate}
              onChange={e => setRegenerate(e.target.checked)}
            >
              重新生成
            </Checkbox>
          </Row>
          <div style={{ maxHeight: 500,
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            padding: 8,
            marginBottom: 8,
           }}>
            <ChatMessages
              messages={[
                {
                  role: 'user',
                  content: query,
                },
                {
                  role: 'assistant',
                  content: smoothExecuteResult,
                },
              ]}
            />
          </div>
          <Input.TextArea
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ minHeight: 100 }}
          />
        </div>
      }
    >
      <Button size="small">AI</Button>
    </Popover>
  );
}
