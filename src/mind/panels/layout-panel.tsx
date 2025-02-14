import { Radio, Button, Switch } from 'antd';
import { Layout } from '../types';
import { useEditor } from '../use-editor';

export function LayoutPanel() {
  const { layout, setLayout, updateLayout, background, setBackground } = useEditor();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
      <Switch size="small" checked={background} onChange={setBackground} checkedChildren="bg" unCheckedChildren="bg" />
    </div>
  );
}
