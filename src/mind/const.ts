import { Layout, MindDSL } from "./types";

export const defaultMindData: MindDSL = {
 layout: Layout.Horizontal,
  nodes: [
    {
      id: '0',
      type: 'text_node',
      data: { label: 'Root' },
      position: { x: 0, y: 0 },
      measured: { width: 50, height: 28 },
    },
    {
      id: '1',
      type: 'text_node',
      data: { label: 'Node 1' },
      position: { x: 100, y: -50 },
      measured: { width: 50, height: 28 },
    },
    {
      id: '2',
      type: 'text_node',
      data: { label: 'Node 2' },
      position: { x: 100, y: 50 },
      measured: { width: 50, height: 28 },
    },
  ],
  edges: [
    {
      id: '0-1',
      source: '0',
      target: '1',
    },
    {
      id: '0-2',
      source: '0',
      target: '2',
    },
  ],
}