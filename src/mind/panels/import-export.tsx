import { useReactFlow } from '@xyflow/react';
import { Button, Popover, Input, Divider, Row, message, Dropdown, Menu } from 'antd';
import { useState } from 'react';
import { jsonrepair } from 'jsonrepair';
import { graphToSimpleTree, treeToGraph } from '../utils';
import { useEditor } from '../use-editor';
import { SimpleTreeNode } from '../types';
import { examples } from './import-examples';
import { DownOutlined } from '@ant-design/icons';

const example = `{
  "label": "根节点",
  "children": [
    { "label": "子节点1" },
    { "label": "子节点2" }
  ]
}`;
function convertTreeToIndentedText(node: SimpleTreeNode, indentSize: number = 4, depth: number = 0): string {
  // Calculate the indentation based on the depth level and the specified indent size
  const indentation = ' '.repeat(indentSize * depth);
  // Start with the current node's label
  let result = `${indentation}- ${node.label}\n`;
  
  // If the node has children, recursively process each child
  if (node.children) {
    for (const child of node.children) {
      result += convertTreeToIndentedText(child, indentSize, depth + 1);
    }
  }
  
  return result;
}

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
            <Button size="small" type="primary" onClick={handleImport}>
              确认导入
            </Button>
            <Dropdown.Button
              icon={<DownOutlined />}
              size="small"
              overlay={
                <Menu>
                  <Menu.Item
                    key="md"
                    onClick={() => {
                      const tree = graphToSimpleTree(getNodes(), getEdges(), { saveID: false });
                      const text = convertTreeToIndentedText(tree, 2);
                      navigator.clipboard.writeText(text).then(() => {
                        message.success('已经复制Markdown数据到剪切板');
                      }).catch(err => {
                        console.error('Failed to copy text: ', err);
                      });
                    }}
                  >
                    复制为Markdown
                  </Menu.Item>
                  <Menu.Item
                    key="graph"
                    onClick={() => {
                      const graph = { nodes: getNodes(), edges: getEdges() };
                      const text = JSON.stringify(graph, null, 2);
                      navigator.clipboard.writeText(text).then(() => {
                        message.success('已经复制图数据到剪切板');
                      }).catch(err => {
                        console.error('Failed to copy text: ', err);
                      });
                    }}
                  >
                    复制为图(节点&边)
                  </Menu.Item>
                </Menu>
              }
              style={{ marginLeft: 8 }}
              onClick={() => {
                const graph = { nodes: getNodes(), edges: getEdges() };
                const tree = graphToSimpleTree(graph.nodes, graph.edges, { saveID: false });
                const text = JSON.stringify(tree, null, 2);
                // eslint-disable-next-line no-console
                console.log(graph, tree);
                navigator.clipboard.writeText(text).then(() => {
                  message.success('已经复制Json数据到剪切板，并打印到控制台');
                }).catch(err => {
                  console.error('Failed to copy text: ', err);
                });
              }}
            >
              导出
            </Dropdown.Button>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            导入模版：
            {examples.map(({ name, data: graphData }) => (
              <Button
                size="small"
                key={name}
                onClick={() => {
                  setData(graphData.nodes, graphData.edges);
                  setTimeout(() => {
                    updateLayout();
                    setTimeout(() => {
                      fitView();
                    }, 200);
                  }, 200);
                }}
              >
                {name}
              </Button>
            ))}
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
      <Button size="small">导入/导出</Button>
    </Popover>
  );
}
