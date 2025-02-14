import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from 'ahooks';
import {
  ReactFlow,
  ReactFlowProvider,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useUpdateNodeInternals,
  type Node,
  type Edge,
  Background,
  Controls,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { edgeTypes, initialEdges } from './edges';
import { EditorContext, EditorContextValues } from './use-editor';
import { EdgeTypeEnum, GraphData, Layout } from './types';
import {
  computeExpandVisible,
  computeGraphLayout,
  deleteInGraph,
  isGraphEqual,
  layoutToDirection,
  loadMindDSLFromLocal,
} from './utils';
import { panels } from './panels';
import { debounce, uniqueId } from 'lodash';
import { HistoryRecord } from './history';
import { NODE_HEIGHT } from './const';
import { AIPanel } from './panels/ai/ai-generate';
import { Switch } from 'antd';


const LayoutFlow = () => {
  const reactFlow = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [layout, setLayoutState] = React.useState<Layout>(Layout.Horizontal);
  const [edgeType, setEdgeTypeState] = React.useState<EdgeTypeEnum>(
    EdgeTypeEnum.Bezier,
  );
  const [background, setBackground] = React.useState(true);
  const [selection, setSelection] = React.useState<OnSelectionChangeParams>({
    nodes: [],
    edges: [],
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const layoutRef = useLatest(layout);
  const edgeTypeRef = useLatest(edgeType);
  const historyGraphDataRef = useRef<GraphData | undefined>();
  const [history] = useState<HistoryRecord>(new HistoryRecord());
  const hiddenMapRef = useRef<Map<string, boolean>>(new Map());

  const computeLayout = useCallback(
    (newLayout: Layout, nodes: Node[], edges: Edge[]) => {
      const direction = layoutToDirection(newLayout);

      const preMap = new Map<string, string>();
      edges.forEach(e => preMap.set(e.target, e.source));
      const { expandNodes, unExpandNodes, expandEdges, hiddenNodesMap } = computeExpandVisible({
        nodes,
        edges,
      });
      hiddenMapRef.current = hiddenNodesMap;
      const layoutGraph = computeGraphLayout(expandNodes, expandEdges, {
        rankdir: direction,
      });
      // console.log('yf123 layout', { nodes, edges }, layoutGraph);
      return {
        nodes: [...layoutGraph.nodes, ...unExpandNodes],
        edges,
      };
    },
    [],
  );

  const isNodeHidden = useCallback(
    (nodeId: string) => {
      return hiddenMapRef.current.get(nodeId) ?? false;
    },
    [],
  );

  const setGraphData = useCallback(
    (graph: GraphData) => {
      const newEdges = graph.edges.map(edge => ({ ...edge, type: edgeTypeRef.current }));
      reactFlow.setNodes(graph.nodes);
      reactFlow.setEdges(newEdges);
    },
    [reactFlow],
  );

  const computeUpdateLayout = useCallback(
    (newLayout: Layout, nodes: Node[], edges: Edge[]) => {
      const layoutGraph = computeLayout(newLayout, nodes, edges);
      // console.log('yf123 layout', { nodes, edges }, layoutGraph);
      setGraphData(layoutGraph);
      // 布局变化会触发锚点位置变化，需手动通知react-flow来更新边的位置
      if (layoutRef.current !== newLayout) {
        setLayoutState(newLayout);
        layoutGraph.nodes.forEach(node => {
          updateNodeInternals(node.id);
        });
      }
    },
    [],
  );

  const handleInsertChild = useCallback(
    (parentID: string) => {
      const sourceNode = reactFlow.getNode(parentID);
      const nodesCount = reactFlow.getNodes().length;
      if (!sourceNode) {
        return;
      }
      const newNode: Node = {
        id: `node_${uniqueId()}`,
        type: 'text_node',
        position: { x: sourceNode.position.x + 100, y: sourceNode.position.y },
        data: { label: `节点${nodesCount}` },
        measured: { width: 50, height: NODE_HEIGHT },
      };
      const newEdge: Edge = {
        id: `edge_${uniqueId()}`,
        type: edgeTypeRef.current,
        source: sourceNode.id,
        target: newNode.id,
        sourceHandle: 'source',
        targetHandle: 'target',
        data: { stroke: sourceNode?.data?.backgroundColor },
      };
      computeUpdateLayout(
        layout,
        [...reactFlow.getNodes(), newNode],
        [...reactFlow.getEdges(), newEdge],
      );
    },
    [reactFlow, layout],
  );

  const handleDelete = useCallback(
    (data: GraphData) => {
      const originData = getGraphData();
      const newGraphData = deleteInGraph(originData, data);
      computeUpdateLayout(layoutRef.current, newGraphData.nodes, newGraphData.edges);
      return Promise.resolve(false);
    },
    [reactFlow],
  );

  const getGraphData = () => ({
    nodes: reactFlow.getNodes(),
    edges: reactFlow.getEdges(),
  })

  const setLayout = useCallback(
    (newLayout: Layout) => {
      computeUpdateLayout(
        newLayout,
        reactFlow.getNodes(),
        reactFlow.getEdges(),
      );
    },
    [reactFlow],
  );

  const updateLayout = useCallback(() => {
    setTimeout(() => {
      setLayout(layoutRef.current);
    }, 200);
  }, []);

  const setEdgeType = useCallback(
    (newEdgeType: EdgeTypeEnum) => {
      setEdgeTypeState(newEdgeType);
      const newEdges = reactFlow.getEdges().map(edge => ({
        ...edge,
        type: newEdgeType,
      }));
      setEdges(newEdges);
    },
    [reactFlow],
  );
  const handleInit = () => {
    const mindDSL = loadMindDSLFromLocal();
    const nodesData = mindDSL?.nodes ?? initialNodes;
    const edgesData = mindDSL?.edges ?? initialEdges;
    computeUpdateLayout(layout, nodesData, edgesData);
  };
  // api
  const contextValues = useMemo(() => {
    const contextValue: EditorContextValues = {
      selection,
      layout,
      background,
      setBackground,
      setLayout,
      updateLayout,
      insertChild: handleInsertChild,
      edgeType,
      setEdgeType,
      computeLayout,
      isNodeHidden,
      history,
      setData: (newNodes, newEdges) => {
        setGraphData({ nodes: newNodes, edges: newEdges });
      },
    };
    return contextValue;
  }, [reactFlow, layout, background, edgeType, selection]);

  const saveToHistory = useCallback(debounce((graphData: GraphData) => {
    console.log('Saved', new Date().toLocaleString(), graphData);
    history.push(JSON.stringify(graphData));
    historyGraphDataRef.current = graphData;
  }, 500), []);
  
  useEffect(() => {
    if (!isGraphEqual({ nodes, edges }, history.currentValue ? JSON.parse(history.currentValue) : undefined)) {
      saveToHistory({ nodes, edges });
    }
  }, [nodes, edges]);

  useEffect(() => {
    history.onChange(() => {
      const newGraphData: GraphData = JSON.parse(history.currentValue);
      reactFlow.setNodes(newGraphData.nodes);
      reactFlow.setEdges(newGraphData.edges);
    });
  }, [history]);
  return (
    <EditorContext.Provider value={contextValues}>

    <div className="editor-container">
      {/* <div className="editor-header">Header</div> */}
      <div className="editor-content">
        <div className="center-content">
          <div className="main-content">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onBeforeDelete={handleDelete}
              onSelectionChange={setSelection}
              onInit={handleInit}
            >
              {panels.map(panel => (
                <Panel position={panel.position} key={panel.position}>
                  {panel.content}
                </Panel>
              ))}
              {background && <Background /> }
              <Controls showInteractive={true} />
            </ReactFlow>
          </div>
        </div>
        <div className="right-bar">
          <AIPanel />
        </div>
      </div>
    </div>
    </EditorContext.Provider>
  );
};

export default function () {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}
