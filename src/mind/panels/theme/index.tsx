import { useReactFlow, Edge } from '@xyflow/react';
import { Popover, Button } from 'antd';
import { graphToTree } from '../../utils';
import { colorThemes, type ColorTheme } from './themes';

function getAllNodeChildren(id: string, edges: Edge[]): string[] {
  const children: string[] = [];
  const visited = new Set<string>();

  function dfs(nodeId: string) {
    // Find direct children of the current node
    const directChildren = edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);

    for (const childId of directChildren) {
      if (!visited.has(childId)) {
        visited.add(childId);
        children.push(childId);
        dfs(childId); // Recursively find children of the child node
      }
    }
  }
  dfs(id);

  return children;
}

export function ColorThemePanel() {
  const { getNodes, getEdges, updateNodeData, updateEdgeData } = useReactFlow();

  const setTheme = (theme: ColorTheme) => {
    const edges = getEdges();
    const rootNode = graphToTree(getNodes(), edges);
    updateNodeData(rootNode.id, {
      backgroundColor: theme.colors[0],
      color: '#fff',
      border: 'none',
    });
    const childrenColors = theme.colors.slice(1);
    rootNode.children?.forEach((node, index) => {
      const colorIndex = index % childrenColors.length;
      const color = childrenColors[colorIndex];

      updateNodeData(node.id, {
        backgroundColor: color,
        color: '#fff',
        border: 'none',
      });
      const allChildren = getAllNodeChildren(node.id, edges);
      allChildren.forEach((childId) => {
        updateNodeData(childId, {
          border: 'none',
        })
      });
      allChildren.concat(node.id).forEach(childId => {
        const edge = edges.find(e => e.target === childId);
        if (edge) {
          updateEdgeData(edge.id, {
            stroke: color,
          });
        }
      });
    });
  };
  return (
    <Popover
      content={
        <div>
          {colorThemes.map(theme => (
            <div
              key={theme.name}
              onClick={() => setTheme(theme)}
              style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              {theme.colors.map(color => (
                <div
                  key={color}
                  style={{
                    width: 30,
                    height: 24,
                    backgroundColor: color,
                    borderRadius: 8,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      }
    >
      <Button size="small">主题</Button>
    </Popover>
  );
}
