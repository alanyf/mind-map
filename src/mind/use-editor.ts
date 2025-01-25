import { createContext, useContext } from 'react';
import { Node, Edge, OnSelectionChangeParams } from '@xyflow/react';
import { Layout, EdgeTypeEnum } from './types';

export interface EditorContextValues {
  selection: OnSelectionChangeParams;
  layout: Layout;
  setLayout: (layout: Layout) => void;
  updateLayout: () => void;
  edgeType: EdgeTypeEnum;
  setEdgeType: (edgeType: EdgeTypeEnum) => void;
  insertChild: (nodeID: string) => void;
  setData: (nodes: Node[], edges: Edge[]) => void;
  computeLayout: (
    layout: Layout,
    nodes: Node[],
    edges: Edge[],
  ) => { nodes: Node[]; edges: Edge[] };
}

export const EditorContext = createContext<EditorContextValues | null>(null);
EditorContext.displayName = 'Editor';

export const useEditor = (): EditorContextValues => {
  const ctx = useContext(EditorContext);
  return ctx as EditorContextValues;
};
