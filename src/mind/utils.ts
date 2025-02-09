import { Node, Edge } from '@xyflow/react';
import Dagre, { GraphLabel } from 'dagre';
import { GraphData, Layout, MindDSL, SimpleTreeNode, TreeNode } from './types';
import { isEqual, pick } from 'lodash';
import { NODE_HEIGHT } from './const';

export function layoutToDirection(layout: Layout): string {
  return layout === Layout.Vertical ? 'TB' : 'LR';
}

export function safetyParseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error(err);
    return undefined;
  }
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
    nodesep: 10,
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
        height: NODE_HEIGHT,
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
  options?: {
    saveID?: boolean;
  },
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

    const treeNode: { id?: string; label: string; children?: SimpleTreeNode[] } = {
      id: node.id,
      label: node.data.label as string,
    };
    if (options?.saveID === false) {
      delete treeNode.id;
    }
    if (children.length > 0) {
      treeNode.children = children;
    }
    return treeNode as SimpleTreeNode;
  }

  // Start building the tree from the root
  return buildSubTree(rootId);
}

/** 删除节点及其子孙节点 */
function deleteNode(
  nodes: Node[],
  edges: Edge[],
  nodeIdToDelete: string
): { nodes: Node[]; edges: Edge[] } {
  // 创建一个 Set 来存储要删除的节点 ID
  const nodesToDelete = new Set<string>();

  // 使用深度优先搜索 (DFS) 来标记所有要删除的节点
  function dfs(nodeId: string) {
    if (nodesToDelete.has(nodeId)) return;
    nodesToDelete.add(nodeId);
    // 查找所有以当前节点为源的边，递归删除目标节点
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        dfs(edge.target);
      }
    });
  }

  // 从要删除的节点开始 DFS
  dfs(nodeIdToDelete);

  // 过滤节点数组，删除标记的节点
  const filteredNodes = nodes.filter(node => !nodesToDelete.has(node.id));

  // 过滤边数组，删除与标记节点相关的边
  const filteredEdges = edges.filter(
    edge => !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

export function deleteInGraph(graphData: GraphData, deleteGraphData: GraphData ) {
  let nodeList = [...graphData.nodes];
  let edgeList = [...graphData.edges];
  deleteGraphData.nodes.forEach(node => {
    const res = deleteNode(nodeList, edgeList, node.id);
    nodeList = res.nodes;
    edgeList = res.edges;
  });
  deleteGraphData.edges.forEach(edge => {
    const res = deleteNode(nodeList, edgeList, edge.target);
    nodeList = res.nodes;
    edgeList = res.edges;
    edgeList = edgeList.filter(e => e.id !== edge.id);
  });
  return {
    nodes: nodeList,
    edges: edgeList,
  } as GraphData;
}

export function isGraphEqual(graph1: GraphData | undefined, graph2: GraphData | undefined) {
  // return isEqual(graph1, graph2);
  if (!graph1 || !graph2) {
    return false;
  }
  const pickNode = (node: Node) => pick(node, 'id', 'data', 'type', 'position', 'measured');
  const pickEdge = (edge: Edge) => pick(edge, 'id', 'source', 'target');
  const pickGraph1 = {
    nodes: graph1.nodes.map(pickNode),
    edges: graph1.edges.map(pickEdge),
  };
  const pickGraph2 = {
    nodes: graph2.nodes.map(pickNode),
    edges: graph2.edges.map(pickEdge),
  };
  const equal = isEqual(pickGraph1, pickGraph2);
  return equal;
}
/** 计算图中展开和未展开的节点和边 */
export function computeExpandVisible(graph: GraphData) {
  const { nodes, edges } = graph;
  const hiddenNodesMap = new Map<string, boolean>();
  const childrenMap = new Map<string, string[]>();
  nodes.forEach(node => childrenMap.set(node.id, []));
  edges.forEach(edge => childrenMap.get(edge.source)?.push(edge.target));
  
  const getNodeAllChildren = (nodeId: string) => {
    const allChildren: string[] = [];
    const getNodeChildren = (id: string) => {
      const children = childrenMap.get(id) ?? [];
      allChildren.push(...children);
      children.forEach(getNodeChildren);
    }
    getNodeChildren(nodeId);
    return allChildren;
  };

  nodes.forEach(node => {
    if (node?.data?.expanded !== false) {
      return;
    }
    const allChildren = getNodeAllChildren(node.id);
    allChildren.forEach(childId => hiddenNodesMap.set(childId, true));
  });
  return {
    hiddenNodesMap,
    expandNodes: nodes.filter(node => !hiddenNodesMap.get(node.id)),
    unExpandNodes: nodes.filter(node => hiddenNodesMap.get(node.id)),
    expandEdges: edges.filter(edge => !hiddenNodesMap.get(edge.target)),
    unExpandEdges: edges.filter(edge => hiddenNodesMap.get(edge.target)),
  };
}