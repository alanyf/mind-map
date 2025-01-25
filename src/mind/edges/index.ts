import type { Edge, EdgeTypes } from '@xyflow/react';
import { EdgeTypeEnum } from '../types';
import { getEdgeComponent } from './color-edge';

export const initialEdges: Edge[] = [
  {
    id: 'a->c',
    type: EdgeTypeEnum.Bezier,
    source: '0',
    target: '1',
  },
  {
    id: 'b->d',
    type: EdgeTypeEnum.Bezier,
    source: '0',
    target: '2',
  },
];

export const edgeTypes: EdgeTypes = {
  [EdgeTypeEnum.Bezier]: getEdgeComponent(EdgeTypeEnum.Bezier),
  [EdgeTypeEnum.Smoothstep]: getEdgeComponent(EdgeTypeEnum.Smoothstep),
  [EdgeTypeEnum.Step]: getEdgeComponent(EdgeTypeEnum.Step),
  [EdgeTypeEnum.Straight]: getEdgeComponent(EdgeTypeEnum.Straight),
};
