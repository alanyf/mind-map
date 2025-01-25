import { Node, Edge, PanelPosition } from '@xyflow/react';

export enum Layout {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export enum EdgeTypeEnum {
  Bezier = 'bezier',
  Smoothstep = 'smoothstep',
  Step = 'step',
  Straight = 'straight',
}

export interface EditorPanel {
  position: PanelPosition;
  content: React.ReactNode;
}

export interface MindDSL {
  layout: Layout;
  nodes: Node[];
  edges: Edge[];
}

export interface TreeNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  children?: TreeNode[];
}

export interface SimpleTreeNode {
  id: string;
  label: string;
  children?: SimpleTreeNode[];
}
