import { Edge, Node } from '@xyflow/react';

// 残缺数据，用来测试单节点补全
export const mockGraphData1: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    {
      id: '0',
      type: 'root_node',
      data: {
        label: '初中生科目',
      },
      position: {
        x: 30,
        y: 120,
      },
      measured: {
        width: 60,
        height: 28,
      },
    },
    {
      id: '1',
      type: 'text_node',
      data: {
        label: '语文',
      },
      position: {
        x: 122,
        y: 24,
      },
      measured: {
        width: 24,
        height: 28,
      },
    },
    {
      id: '2',
      type: 'text_node',
      data: {
        label: '阅读理解',
      },
      position: {
        x: 208,
        y: 0,
      },
      measured: {
        width: 48,
        height: 28,
      },
    },
    {
      id: '3',
      type: 'text_node',
      data: {
        label: '作文',
      },
      position: {
        x: 208,
        y: 48,
      },
      measured: {
        width: 24,
        height: 28,
      },
    },
    {
      id: '4',
      type: 'text_node',
      data: {
        label: '数学',
      },
      position: {
        x: 122,
        y: 120,
      },
      measured: {
        width: 24,
        height: 28,
      },
    },
    {
      id: '7',
      type: 'text_node',
      data: {
        label: '英语',
      },
      position: {
        x: 122,
        y: 240,
      },
      measured: {
        width: 24,
        height: 28,
      },
    },
  ],
  edges: [
    {
      id: '0-1',
      source: '0',
      target: '1',
    },
    {
      id: '1-2',
      source: '1',
      target: '2',
    },
    {
      id: '1-3',
      source: '1',
      target: '3',
    },
    {
      id: '0-4',
      source: '0',
      target: '4',
    },
    {
      id: '0-7',
      source: '0',
      target: '7',
    },
  ],
};
