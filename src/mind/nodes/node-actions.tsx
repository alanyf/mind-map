import { NodeProps } from '@xyflow/react';
import { PlusCircleFilled } from '@ant-design/icons';
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
