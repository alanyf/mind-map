import { useReactFlow, type NodeProps } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import { useLatest } from 'ahooks';

export function EditableText({
  node,
  className,
}: {
  node: NodeProps;
  className?: string;
}) {
  const [edit, setEdit] = useState(false);
  const text = (node.data?.label ?? '') as string;
  const { updateNodeData } = useReactFlow();
  const textInputDomRef = useRef<HTMLSpanElement>(null);
  const editRef = useLatest(edit);
  useEffect(() => {
    const handleEvent = (e: MouseEvent) => {
      if (editRef.current === true) {
        e.stopPropagation();
      }
    };
    textInputDomRef.current?.addEventListener('mousedown', handleEvent);
  }, [edit]);
  return (
    <div
      className={className}
      onDoubleClick={() => {
        setEdit(true);
        // 当成nextTick来用
        window.requestAnimationFrame(() => {
          if (textInputDomRef.current) {
            textInputDomRef.current.innerText = text;
            textInputDomRef.current.focus();
          }
        });
      }}
    >
      {edit ? (
        <span
          ref={textInputDomRef}
          contentEditable={edit}
          style={{
            cursor: 'auto',
            outline: 'none',
          }}
          onBlur={() => {
            updateNodeData(node.id, {
              label: textInputDomRef.current?.innerText,
            });
            setEdit(false);
          }}
        ></span>
      ) : (
        text
      )}
    </div>
  );
}
