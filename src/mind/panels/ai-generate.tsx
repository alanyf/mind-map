/* eslint-disable no-console */
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { Button, Popover, Input, Divider, Row, Checkbox } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { cloneDeep, throttle, uniqueId } from 'lodash';
import { graphToSimpleTree, treeToGraph } from '../utils';
import { useEditor } from '../use-editor';
import { RespondingStatus, useLLMStreamCall } from '../use-llm-stream-call';
import { SimpleTreeNode } from '../types';

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
    const query = `
      请根据整体思维导图的数据，扩写节点${selectedNodeRef.current.id}的子节点。
      直接生成一个以节点${selectedNodeRef.current.id}为根节点的独立思维导图。
      ${userQueryStr}
      \`\`\`json${jsonData}\n\`\`\``;
    start({
      url: `http://localhost:3000/api/fe-plugin/mind-map-gen-stream?query=${query}`,
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
    const queryStr = `${query}${contextData}`;
    start({
      url: `http://localhost:3000/api/fe-plugin/mind-map-gen-stream?query=${queryStr}`,
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
        <div style={{ width: 400 }}>
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
          <Divider />
          <Input.TextArea
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ minHeight: 200 }}
          />
        </div>
      }
    >
      <Button size="small">AI</Button>
    </Popover>
  );
}
