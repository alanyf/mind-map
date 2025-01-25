import { useReactFlow } from '@xyflow/react';
import { Button, Popover, Input, Divider, Row } from 'antd';
import { useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { treeToGraph } from '../utils';
import { useEditor } from '../use-editor';

const example = `{
  "label": "根节点",
  "children": [
    { "label": "子节点1" },
    { "label": "子节点2" }
  ]
}`;

export function ImportPanel() {
  const { getEdges, getNodes, fitView } = useReactFlow();
  const { setData, updateLayout } = useEditor();
  const [dataStr, setDataStr] = useState(example);

  const handleImport = () => {
    try {
      const jsonStr = jsonrepair(dataStr);
      const treeData = JSON.parse(jsonStr);
      const graphData = treeToGraph(treeData);
      // const data = JSON.parse(dataStr) as { nodes: Node[]; edges: Edge[] };
      setData(graphData.nodes, graphData.edges);
      setTimeout(() => {
        updateLayout();
        setTimeout(() => {
          fitView();
        }, 200);
      }, 200);
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <Popover
      content={
        <div style={{ width: 400 }}>
          <Row>
            <Button size="small" onClick={handleImport}>
              确认导入
            </Button>
            <Button
              size="small"
              style={{ marginLeft: 8 }}
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log({
                  nodes: getNodes(),
                  edges: getEdges(),
                });
              }}
            >
              导出到控制台
            </Button>
          </Row>
          <Divider />
          <Input.TextArea
            value={dataStr}
            onChange={e => setDataStr(e.target.value)}
            style={{ minHeight: 200 }}
          />
        </div>
      }
    >
      <Button size="small">导入</Button>
    </Popover>
  );
}
