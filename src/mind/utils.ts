import { Node, Edge } from '@xyflow/react';
import Dagre, { GraphLabel } from 'dagre';
import { Layout, MindDSL, SimpleTreeNode, TreeNode } from './types';
import { mockGraphData1 } from './mock';

export function layoutToDirection(layout: Layout): string {
  return layout === Layout.Vertical ? 'TB' : 'LR';
}

export function saveMindDSLToLocal(dsl: MindDSL) {
  localStorage.setItem('mind_map_dsl_data', JSON.stringify(dsl));
}
export function loadMindDSLFromLocal() {
  const str = localStorage.getItem('mind_map_dsl_data');
  try {
    const res = JSON.parse(str ?? '') as MindDSL;
    return res;
  } catch (err) {
    console.error(err);
  }
  return undefined;
}
export function clearMindDSLInLocal() {
  localStorage.setItem('mind_map_dsl_data', '');
}

/** 计算图的布局 */
export const computeGraphLayout = (
  nodes: Node[],
  edges: Edge[],
  options: GraphLabel = {},
): { nodes: Node[]; edges: Edge[] } => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  // 参数配置介绍：https://github.com/dagrejs/dagre/wiki
  g.setGraph({
    // 排版方向
    rankdir: 'LR',
    // 节点间距
    nodesep: 20,
    // 边间距
    // ranksep: 40,
    // align: 'DR',
    // ranker: 'network-simplex',
    ...options,
  });

  edges.forEach(edge => g.setEdge(edge.source, edge.target));
  nodes.forEach(node =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map(node => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x + 0;
      const y = position.y - (node.measured?.height ?? 0) / 2;

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

function graphToTreeWithRootID(
  rootId: string,
  nodes: Node[],
  edges: Edge[],
): TreeNode {
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  function buildSubTree(nodeId: string): TreeNode {
    const node = nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    const childrenEdges = edges.filter(edge => edge.source === nodeId);
    const children = childrenEdges.map(edge => buildSubTree(edge.target));

    const treeNode: TreeNode = {
      id: node.id,
      type: node.type ?? '',
      data: node.data,
      children: children.length > 0 ? children : undefined,
    };

    return treeNode;
  }

  // Start building the tree from the root
  return buildSubTree(rootId);
}
export function findGraphRoot(nodes: Node[], edges: Edge[]): Node | undefined {
  const inDegree = new Map<string, number>();
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    nodeMap.set(node.id, node);
  });
  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const rootNode = Array.from(inDegree.entries()).find(
    ([_, degree]) => degree === 0,
  );
  const rootID = rootNode ? rootNode[0] : '';
  return nodeMap.get(rootID);
}

export function graphToTree(nodes: Node[], edges: Edge[]): TreeNode {
  const root = findGraphRoot(nodes, edges);
  if (!root) {
    throw new Error('No root node found in the graph');
  }
  return graphToTreeWithRootID(root.id, nodes, edges);
}

/** 估算文本宽度 */
export function measureTextWidth(
  text: string,
  style: { fontSize: `${number}px`; fontFamily: string },
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2D context not available');
  }
  const font = `${style.fontSize} ${style.fontFamily}`;
  context.font = font;
  const metrics = context.measureText(text);
  const { width } = metrics;
  return width;
}

export function treeToGraph(tree: SimpleTreeNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 0;

  function traverse(node: SimpleTreeNode, parentId: string | null): string {
    const currentId = node.id || (nodeIdCounter++).toString();
    const nodeType = !parentId ? 'root_node' : 'text_node';
    nodes.push({
      id: currentId,
      type: nodeType,
      data: { label: node.label },
      position: { x: 0, y: 0 },
      measured: {
        width: measureTextWidth(node.label, {
          fontSize: '12px',
          fontFamily:
            'nunito_for_arco, PingFang SC, Microsoft YaHei, Arial, sans-serif',
        }),
        height: 28,
      },
    });
    if (parentId !== null) {
      edges.push({
        id: `${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
      });
    }
    node.children?.forEach(child => traverse(child, currentId));
    return currentId;
  }
  traverse(tree, null);
  return { nodes, edges };
}
export function graphToSimpleTree(
  nodes: Node[],
  edges: Edge[],
): SimpleTreeNode {
  const root = findGraphRoot(nodes, edges);
  if (!root) {
    throw new Error('No root node found in the graph');
  }
  const rootId = root.id;
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  function buildSubTree(nodeId: string): SimpleTreeNode {
    const node = nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    const childrenEdges = edges.filter(edge => edge.source === nodeId);
    const children = childrenEdges.map(edge => buildSubTree(edge.target));

    const treeNode: SimpleTreeNode = {
      id: node.id,
      label: node.data.label as string,
    };
    if (children.length > 0) {
      treeNode.children = children;
    }
    return treeNode;
  }

  // Start building the tree from the root
  return buildSubTree(rootId);
}

console.log(graphToSimpleTree(mockGraphData1.nodes, mockGraphData1.edges));
