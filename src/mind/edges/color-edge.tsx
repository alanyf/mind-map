import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  GetBezierPathParams,
  Position,
} from '@xyflow/react';
import { useEditor } from '../use-editor';
import { EdgeTypeEnum, Layout } from '../types';

export function CustomEdge(props: EdgeProps & { edgeType: EdgeTypeEnum }) {
  const { id, sourceX, sourceY, targetX, targetY, selected, data, edgeType } =
    props;
  const { layout } = useEditor();
  const params: GetBezierPathParams = {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition:
      layout === Layout.Horizontal ? Position.Right : Position.Bottom,
    targetPosition: layout === Layout.Horizontal ? Position.Left : Position.Top,
  };
  let edgePath = '';
  if (edgeType === EdgeTypeEnum.Step || edgeType === EdgeTypeEnum.Smoothstep) {
    edgePath = getSmoothStepPath(params)[0];
  } else if (edgeType === EdgeTypeEnum.Straight) {
    edgePath = getStraightPath(params)[0];
  } else {
    edgePath = getBezierPath(params)[0];
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: (data?.stroke as string) ?? '#aaa',
          strokeWidth: selected ? 2 : 1,
        }}
      />
    </>
  );
}

export function getEdgeComponent(edgeType: EdgeTypeEnum) {
  return (props: EdgeProps) => <CustomEdge {...props} edgeType={edgeType} />;
}
