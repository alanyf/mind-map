import React, { useCallback, useMemo } from 'react';
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
import { EdgeTypeEnum, Layout } from './types';
import {
  computeGraphLayout,
  layoutToDirection,
  loadMindDSLFromLocal,
} from './utils';
import { panels } from './panels';
import { uniqueId } from 'lodash';

const LayoutFlow = () => {
  const reactFlow = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [layout, setLayoutState] = React.useState<Layout>(Layout.Horizontal);
  const [edgeType, setEdgeTypeState] = React.useState<EdgeTypeEnum>(
    EdgeTypeEnum.Bezier,
  );
  const [selection, setSelection] = React.useState<OnSelectionChangeParams>({
    nodes: [],
    edges: [],
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const layoutRef = useLatest(layout);
  const edgeTypeRef = useLatest(edgeType);

  const computeLayout = useCallback(
    (newLayout: Layout, nodes: Node[], edges: Edge[]) => {
      const direction = layoutToDirection(newLayout);
      const layouted = computeGraphLayout(nodes, edges, {
        rankdir: direction,
      });
      // console.log('yf123 layout', { nodes, edges }, layouted);
      return layouted;
    },
    [],
  );

  const computeUpdateLayout = useCallback(
    (newLayout: Layout, nodes: Node[], edges: Edge[]) => {
      const layouted = computeLayout(newLayout, nodes, edges);
      // console.log('yf123 layout', { nodes, edges }, layouted);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
      // 布局变化会触发锚点位置变化，需手动通知react-flow来更新边的位置
      if (layoutRef.current !== newLayout) {
        setLayoutState(newLayout);
        layouted.nodes.forEach(node => {
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
        position: {
          x: sourceNode.position.x + 100,
          y: sourceNode.position.y,
        },
        data: { label: `节点${nodesCount}` },
        measured: {
          width: 50,
          height: 28,
        },
      };
      const newEdge: Edge = {
        id: `edge_${uniqueId()}`,
        type: edgeTypeRef.current,
        source: sourceNode.id,
        target: newNode.id,
        sourceHandle: 'source',
        targetHandle: 'target',
        data: {
          stroke: sourceNode?.data?.backgroundColor,
        },
      };
      computeUpdateLayout(
        layout,
        [...reactFlow.getNodes(), newNode],
        [...reactFlow.getEdges(), newEdge],
      );
    },
    [reactFlow, layout],
  );

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
      setLayout,
      updateLayout,
      insertChild: handleInsertChild,
      edgeType,
      setEdgeType,
      computeLayout,
      setData: (newNodes, newEdges) => {
        reactFlow.setNodes(newNodes);
        reactFlow.setEdges(newEdges);
      },
    };
    return contextValue;
  }, [reactFlow, layout, edgeType, selection]);
  return (
    <EditorContext.Provider value={contextValues}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDelete={() => updateLayout()}
        onSelectionChange={setSelection}
        onInit={handleInit}
      >
        {panels.map(panel => (
          <Panel position={panel.position} key={panel.position}>
            {panel.content}
          </Panel>
        ))}
        <Background />
        <Controls showInteractive={true} />
      </ReactFlow>
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
