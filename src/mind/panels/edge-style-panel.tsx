import { Select } from 'antd';
import { useEditor } from '../use-editor';
import { EdgeTypeEnum } from '../types';

export function EdgeStylePanel() {
  const { edgeType, setEdgeType } = useEditor();
  return (
    <Select
      value={edgeType}
      size="small"
      options={[
        { label: '贝塞尔曲线', value: EdgeTypeEnum.Bezier },
        { label: '平滑折线', value: EdgeTypeEnum.Smoothstep },
        { label: '折线', value: EdgeTypeEnum.Step },
        { label: '直线', value: EdgeTypeEnum.Straight },
      ]}
      onChange={e => setEdgeType(e)}
    />
  );
}
