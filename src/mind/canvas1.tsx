/* eslint-disable max-lines */
import React, { useCallback, useEffect, useState } from 'react';
import dagre from 'dagre';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  ReactFlowProvider,
  BuiltInNode,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import { TreeNode } from '@/utils/tree-node-operate/node';
import '@xyflow/react/dist/style.css';

// Create Dagre Graph for layout
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

interface MindNode {
  id: string;
  type: string;
  name: string;
  data?: {
    text?: string;
  };
  children?: MindNode[];
}

const defaultMindTree1: MindNode = {
  id: '0',
  type: 'node',
  name: '根节点',
  children: [
    {
      id: '1',
      type: 'node',
      name: '节点 1',
    },
    {
      id: '2',
      type: 'node',
      name: '节点 2',
    },
  ],
};

const defaultMindTree: MindNode = {
  id: '0',
  type: 'node',
  name: '根节点',
  children: [
    {
      id: '1',
      type: 'node',
      name: '节点 1',
      children: [
        {
          id: '1-1',
          type: 'node',
          name: '节点 1-1',
          children: [
            {
              id: '1-1-1',
              type: 'node',
              name: '节点 1-1-1',
              children: [
                {
                  id: '1-1-1-1',
                  type: 'node',
                  name: '节点 1-1-1-1',
                  children: [
                    {
                      id: '1-1-1-1-1',
                      type: 'node',
                      name: '节点 1-1-1-1-1',
                    },
                    {
                      id: '1-1-1-1-2',
                      type: 'node',
                      name: '节点 1-1-1-1-2',
                    },
                  ],
                },
                {
                  id: '1-1-1-2',
                  type: 'node',
                  name: '节点 1-1-1-2',
                },
              ],
            },
            {
              id: '1-1-2',
              type: 'node',
              name: '节点 1-1-2',
            },
          ],
        },
        {
          id: '1-2',
          type: 'node',
          name: '节点 1-2',
        },
      ],
    },
    {
      id: '2',
      type: 'node',
      name: '节点 2',
      children: [
        {
          id: '2-1',
          type: 'node',
          name: '节点 2-1',
          children: [
            {
              id: '2-1-1',
              type: 'node',
              name: '节点 2-1-1',
              children: [
                {
                  id: '2-1-1-1',
                  type: 'node',
                  name: '节点 2-1-1-1',
                  children: [
                    {
                      id: '2-1-1-1-1',
                      type: 'node',
                      name: '节点 2-1-1-1-1',
                    },
                    {
                      id: '2-1-1-1-2',
                      type: 'node',
                      name: '节点 2-1-1-1-2',
                    },
                  ],
                },
                {
                  id: '2-1-1-2',
                  type: 'node',
                  name: '节点 2-1-1-2',
                },
              ],
            },
            {
              id: '2-1-2',
              type: 'node',
              name: '节点 2-1-2',
            },
          ],
        },
        {
          id: '2-2',
          type: 'node',
          name: '节点 2-2',
        },
      ],
    },
  ],
};

function mindTreeLayout1(rootNode: MindNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const traverse = (node: MindNode, parentId: string | null) => {
    const newNode: Node = {
      id: node.id,
      type: node.type,
      data: {
        name: node.name,
      },
      position: { x: 0, y: 0 },
    };
    nodes.push(newNode);
    if (node.children) {
      const parentId = node.id;
      node.children.forEach(child => {
        const newEdge: Edge = {
          id: child.id,
          type: 'edge',
          source: parentId,
          target: child.id,
        };
        edges.push(newEdge);
        traverse(child, node.id);
      });
    }
  };

  traverse(rootNode, null);
  return {
    nodes,
    edges,
  };
}

function mindTreeLayout(rootNode: TreeNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const graphNodes: any[] = [];
  const mindNodeMap: Map<string, TreeNode> = new Map();
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB' });
  const traverse = (node: TreeNode) => {
    mindNodeMap.set(node.id, node);
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    if (node.children) {
      const parentId = node.id;
      node.children.forEach(child => {
        graph.setEdge(parentId, child.id);
        edges.push({
          id: `${parentId}_${child.id}`,
          type: 'edge',
          source: parentId,
          target: child.id,
        });
        traverse(child);
      });
    }
  };
  traverse(rootNode);
  dagre.layout(graph);

  graph.nodes().forEach(nodeId => {
    const nodeWithPosition = graph.node(nodeId);
    const mindNode = mindNodeMap.get(nodeId);
    graphNodes.push(nodeWithPosition);
    const newNode: Node = {
      id: nodeId,
      type: 'node',
      data: {
        name: mindNode?.name,
        label: mindNode?.name,
      },
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    nodes.push(newNode);
  });
  console.log('layout', nodes, edges, rootNode, graphNodes);
  return {
    nodes,
    edges,
  };
}

// Custom node with "+" button
const CustomNode = (props: Node) => {
  const { label, id, type, data } = props;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #ccc',
        padding: `0 12px`,
        height: nodeHeight,
        borderRadius: 5,
      }}
    >
      <div>{data.name}</div>
      <button
        onClick={event => {
          event.stopPropagation();
        }}
        style={{
          marginLeft: 10,
          backgroundColor: '#293ef6',
          border: 'none',
          borderRadius: '50%',
          width: 20,
          height: 20,
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        +
      </button>

      {type !== 'root' && <Handle type="source" position={Position.Left} />}

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const CustomEdge = (props: Edge) => {
  const { sourceX, sourceY, targetX, targetY } = props;
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return (
    <line
      style={{
        stroke: '#aaa',
        strokeWidth: 1,
        fill: 'none',
      }}
      d={path}
    />
  );
};

const MindMap = () => {
  const [rootNode] = useState(new TreeNode(defaultMindTree));

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [idCounter, setIdCounter] = useState(4);

  const updateLayout = () => {
    const res = mindTreeLayout(rootNode);
    setNodes(res.nodes);
    setEdges(res.edges);
  };

  const onAddNode = parentId => {
    const newNodeId = `${idCounter}`;
    setIdCounter(idCounter => idCounter + 1);

    const newNode: MindNode = {
      id: newNodeId,
      type: 'node',
      name: `新节点${newNodeId}`,
    };
  };

  const onLoad = useCallback(
    reactFlowInstance => {
      setReactFlowInstance(reactFlowInstance);
      reactFlowInstance.fitView();
    },
    [setReactFlowInstance],
  );

  const handleNodesDelete = (nodes: Node[]) => {
    console.log('delete node', nodes);
  };

  useEffect(() => {
    updateLayout();
  }, []);

  return (
    <ReactFlowProvider>
      <div style={{ height: '100vh', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesDelete={handleNodesDelete}
          nodeTypes={nodeTypes}
          onLoad={onLoad}
          elementsSelectable={false}
          nodesConnectable={false}
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default MindMap;
