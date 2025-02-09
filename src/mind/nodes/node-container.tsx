import { Handle, NodeProps, Position } from '@xyflow/react';
import { useEditor } from '../use-editor';
import { InsertChildAction, ExpandChildAction } from './node-actions';
import { NODE_HEIGHT } from '../const';

interface DataType {
  label?: string;
  border?: string;
  backgroundColor?: string;
  color?: string;
}

export function NodeContainer({
  node,
  enableSourceHandle = true,
  enableTargetHandle = true,
  children,
}: {
  node: NodeProps;
  enableSourceHandle?: boolean;
  enableTargetHandle?: boolean;
  children?: React.ReactNode;
}) {
  // console.log('yf123 node', node);
  const { layout, isNodeHidden } = useEditor();
  const sourcePosition =
    layout === 'vertical' ? Position.Bottom : Position.Right;
  const targetPosition = layout === 'vertical' ? Position.Top : Position.Left;
  const data = node.data as DataType | undefined;
  if (isNodeHidden(node.id)) {
    return null;
  }
  return (
    <div
      className={`node-container node-${node.data?.expanded === false ? 'collapse' : 'expand'}`}
      data-node-type={node.type}
      data-node-id={node.id}
      style={{
        position: 'relative',
        border: data?.border ?? '1px solid #aaa',
        backgroundColor: data?.backgroundColor ?? '#fff',
        color: data?.color ?? '#000',
        outline: node.selected ? '2px solid #0067edbb' : 'none',
        borderRadius: 4,
        boxSizing: 'border-box',
        padding: '4px 8px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 40,
        minHeight: NODE_HEIGHT,
        height: NODE_HEIGHT,
      }}
    >
      <div className="node-content">{children}</div>
      {enableSourceHandle && (
        <Handle
          type="source"
          position={sourcePosition}
          id="source"
          style={{ visibility: 'hidden' }}
        />
      )}
      {enableTargetHandle && (
        <Handle
          type="target"
          position={targetPosition}
          id="target"
          style={{ visibility: 'hidden', width: 0, height: 0 }}
        />
      )}
      {node.selected && node.data?.expanded !== false && <InsertChildAction node={node} />}

      {!node.selected || node.data?.expanded === false ? <ExpandChildAction node={node} /> : null}
    </div>
  );
}
