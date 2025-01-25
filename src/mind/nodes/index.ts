import type { Node, NodeTypes, BuiltInNode } from '@xyflow/react';
import { RootNode, TextNode } from './base-node';

export type PositionLoggerNodeType = Node<
  {
    label?: string;
  },
  'position-logger'
>;

export type RootNodeType = Node<
  {
    label?: string;
  },
  'root_node'
>;

export type TextNodeType = Node<
  {
    label?: string;
  },
  'text_node'
>;

export type AppNode =
  | BuiltInNode
  | PositionLoggerNodeType
  | RootNodeType
  | TextNodeType;

export const initialNodes: AppNode[] = [
  {
    id: '0',
    type: 'root_node',
    position: {
      x: 0,
      y: 45.5,
    },
    data: {
      label: '根节点',
    },
    measured: {
      width: 58,
      height: 41,
    },
  },
  {
    id: '1',
    type: 'text_node',
    position: {
      x: 109,
      y: 0,
    },
    data: {
      label: '子节点1',
    },
    measured: {
      width: 63,
      height: 41,
    },
  },
  {
    id: '2',
    type: 'text_node',
    position: {
      x: 108,
      y: 91,
    },
    data: {
      label: '子节点2',
    },
    measured: {
      width: 65,
      height: 41,
    },
  },
];

export const nodeTypes: NodeTypes = {
  root_node: RootNode,
  text_node: TextNode,
  // Add any of your custom nodes here!
};
