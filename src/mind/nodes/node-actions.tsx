import { NodeProps, useReactFlow } from '@xyflow/react';
import { LeftCircleFilled, PlusCircleFilled, RightCircleFilled } from '@ant-design/icons';
import { useEditor } from '../use-editor';
import { Layout } from '../types';

export function InsertChildAction({ node }: { node: NodeProps | undefined }) {
  const { layout, insertChild } = useEditor();
  if (!node) {
    return null;
  }
  return (
    <div
      className="insert-child-action-container"
      style={{
        position: 'absolute',
        ...(layout === Layout.Horizontal
          ? {
              right: -4,
              top: (node.height ?? 0) / 2,
              transform: 'translate(100%, -50%)',
            }
          : {
              bottom: -4,
              left: (node.width ?? 0) / 2,
              transform: 'translate(-50%, 100%)',
            }),
        width: 12,
        height: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        cursor: 'pointer',
        color: '#0067ed',
        fontSize: 12,
      }}
      onClick={() => insertChild(node.id)}
    >
      <PlusCircleFilled className="insert-child-action" />
    </div>
  );
}


export function ExpandChildAction({ node }: { node: NodeProps | undefined }) {
  const { layout, updateLayout } = useEditor();
  const reactFlow = useReactFlow();
  const handleExpand = (nodeId: string) => {
    reactFlow.updateNodeData(nodeId, {
      expanded: node?.data?.expanded !== false ? false : true,
    });
    updateLayout();
  }
  if (!node) {
    return null;
  }
  return (
    <div
      className="expand-child-action-container"
      style={{
        position: 'absolute',
        ...(layout === Layout.Horizontal
          ? {
              right: 0,
              top: (node.height ?? 0) / 2,
              transform: 'translate(100%, -50%)',
            }
          : {
              bottom: 0,
              left: (node.width ?? 0) / 2,
              transform: 'translate(-50%, 100%)',
            }),
        width: 12,
        height: 12,
        // display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#fff',
        cursor: 'pointer',
        color: '#0067ed',
        fontSize: 12,
        paddingLeft: layout === Layout.Horizontal ? 4 : 0,
        paddingTop: layout === Layout.Horizontal ? 0 : 4,
      }}
      onClick={() => handleExpand(node.id)}
    >
      {node.data.expanded === false ? <RightCircleFilled
        className="expand-child-action"
        style={{ transform: `rotate(${layout === Layout.Horizontal ? 0 : 90}deg)` }}
      /> : <LeftCircleFilled
        className="expand-child-action"
        style={{ transform: `rotate(${layout === Layout.Horizontal ? 0 : 90}deg)` }}
      />}
    </div>
  );
}

