import { Radio, Button } from 'antd';
import { Layout } from '../types';
import { useEditor } from '../use-editor';

export function LayoutPanel() {
  const { layout, setLayout, updateLayout } = useEditor();
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <Radio.Group
        value={layout}
        optionType="button"
        size="small"
        options={[
          { label: '水平', value: Layout.Horizontal },
          { label: '垂直', value: Layout.Vertical },
        ]}
        onChange={e => {
          setLayout(e.target.value);
        }}
      />
      <Button
        size="small"
        onClick={() => {
          updateLayout();
        }}
      >
        自动布局
      </Button>
    </div>
  );
}
