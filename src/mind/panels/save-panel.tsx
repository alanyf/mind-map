import { DownOutlined } from '@ant-design/icons';
import { useReactFlow } from '@xyflow/react';
import { Dropdown, Menu, message } from 'antd';
import { useEditor } from '../use-editor';
import { clearMindDSLInLocal, saveMindDSLToLocal } from '../utils';
import { initialNodes } from '../nodes';
import { initialEdges } from '../edges';

export function SavePanel() {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { layout } = useEditor();
  return (
    <Dropdown.Button
      icon={<DownOutlined />}
      size="small"
      overlay={
        <Menu>
          <Menu.Item
            key="clear"
            onClick={() => {
              clearMindDSLInLocal();
              setNodes(initialNodes);
              setEdges(initialEdges);
              message.success('已清空');
            }}
          >
            清空
          </Menu.Item>
        </Menu>
      }
      onClick={() => {
        saveMindDSLToLocal({
          layout,
          nodes: getNodes(),
          edges: getEdges(),
        });
        message.success('已保存');
      }}
    >
      保存
    </Dropdown.Button>
  );
}
