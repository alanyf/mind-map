import { type NodeProps } from '@xyflow/react';

import { NodeContainer } from './node-container';
import { EditableText } from './ediable-text';

export function RootNode(node: NodeProps) {
  return (
    <NodeContainer node={node} enableTargetHandle={false}>
      <EditableText node={node} className="node-title" />
    </NodeContainer>
  );
}

export function TextNode(node: NodeProps) {
  return (
    <NodeContainer node={node}>
      <EditableText node={node} className="node-title" />
    </NodeContainer>
  );
}
