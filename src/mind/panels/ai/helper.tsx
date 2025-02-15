import { SimpleTreeNode } from "@/mind/types";
import { DoubleLeftOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { get, uniqueId } from "lodash";


export function resetChildrenNodeId(tree: SimpleTreeNode) {
  const dfs = (node: SimpleTreeNode) => {
    node.id = uniqueId();
    node.children?.forEach(dfs);
  };
  // 根节点不重置
  tree.children?.forEach(dfs);
  return tree;
}


export function getJsonDataFromMarkdown(markdown: string) {
  if (markdown.indexOf('```json') >= 0) {
    const json =
      markdown
        .split('```json')[1]
        ?.split('```')?.[0]
        ?.replace('```', '')
        ?.trim() ?? '';
    return json;
  }
  if (markdown.indexOf('```\n') >= 0) {
    const json =
      markdown
        .split('```\n')[1]
        ?.split('```')?.[0]
        ?.replace('```', '')
        ?.trim() ?? '';
    return json;
  }
  return markdown;
}

export function ExpandAction({ visible, setVisible }: {  visible: boolean; setVisible: (visible: boolean) => void; }) {
  return <div style={{
    width: 20,
    height: 20,
    padding: '0 4px',
    backgroundColor: '#fff',
    // boxShadow: '0 0 4px #0004',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#000',
    fontSize: 12,
  }}
  onClick={() => setVisible(!visible)}>
    {visible ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
  </div>
}

export function MagicAIAction({ visible, setVisible }: {  visible: boolean; setVisible: (visible: boolean) => void; }) {
  return <Tooltip title="AI生成思维导图" placement='left'>
    <div style={{
      width: 40,
      height: 40,
      border: '1px solid #eee',
      backgroundColor: '#fff',
      boxShadow: '0 0 4px #0004',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#000',
      fontSize: 12,
      position: 'absolute',
      top: 60,
      left: -50,
      zIndex: 100,
    }}
    onClick={() => setVisible(!visible)}>
      <svg
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="#751cfc">
        <path d="M643.657143 95.085714c-7.314286-21.942857-43.885714-21.942857-51.2 0l-14.628572 29.257143c0 7.314286-7.314286 14.628571-14.628571 14.628572l-29.257143 14.628571c-21.942857 7.314286-21.942857 36.571429 0 43.885714l29.257143 14.628572c7.314286 0 14.628571 7.314286 14.628571 14.628571l14.628572 29.257143c7.314286 21.942857 43.885714 21.942857 51.2 0l14.628571-29.257143c0-7.314286 7.314286-14.628571 14.628572-14.628571l29.257143-14.628572c21.942857-7.314286 21.942857-43.885714 0-51.2l-29.257143-7.314285c-7.314286-7.314286-14.628571-7.314286-14.628572-14.628572l-14.628571-29.257143zM234.057143 607.085714c-7.314286-14.628571-14.628571-29.257143-36.571429-29.257143s-36.571429 14.628571-43.885714 29.257143v7.314286c-14.628571 29.257143-36.571429 51.2-58.514286 65.828571h-7.314285c-14.628571 14.628571-21.942857 21.942857-21.942858 36.571429s7.314286 29.257143 21.942858 36.571429l7.314285 7.314285c29.257143 21.942857 51.2 43.885714 65.828572 73.142857v7.314286c7.314286 14.628571 21.942857 29.257143 36.571428 29.257143 21.942857 0 36.571429-14.628571 43.885715-29.257143l7.314285-7.314286c14.628571-29.257143 36.571429-51.2 58.514286-65.828571h7.314286c14.628571-7.314286 21.942857-21.942857 21.942857-36.571429s-7.314286-29.257143-21.942857-36.571428L292.571429 672.914286c-21.942857-14.628571-43.885714-36.571429-58.514286-65.828572zM848.457143 358.4c7.314286-21.942857 43.885714-21.942857 51.2 0l7.314286 14.628571c0 7.314286 7.314286 14.628571 14.628571 14.628572l14.628571 7.314286c21.942857 7.314286 21.942857 43.885714 0 51.2l-14.628571 7.314285c-7.314286 0-14.628571 7.314286-14.628571 14.628572l-7.314286 14.628571c-7.314286 21.942857-43.885714 21.942857-51.2 0l-7.314286-14.628571c0-7.314286-7.314286-14.628571-14.628571-14.628572l-14.628572-7.314285c-21.942857-7.314286-21.942857-43.885714 0-51.2l14.628572-7.314286c7.314286 0 14.628571-7.314286 14.628571-14.628572l7.314286-14.628571zM928.914286 738.742857L365.714286 175.542857c-29.257143-29.257143-87.771429-29.257143-117.028572 0L160.914286 263.314286c-29.257143 29.257143-29.257143 87.771429 0 117.028571l563.2 563.2c29.257143 29.257143 87.771429 29.257143 117.028571 0l87.771429-87.771428c29.257143-29.257143 29.257143-80.457143 0-117.028572zM219.428571 321.828571l87.771429-87.771428 109.714286 109.714286L329.142857 438.857143 219.428571 321.828571z m563.2 563.2L387.657143 497.371429l87.771428-87.771429 387.657143 394.971429-80.457143 80.457142z"></path>
      </svg>
    </div>
  </Tooltip>
}


export function extractResponseFromChunk(chunk: string, responsePath?: string): string {
  if (!responsePath) {
    return chunk;
  }
  let data = chunk.trim();
  const response = data
    .split('}\n{"')
    .join('}__split_chunk__{"')
    .split('__split_chunk__')
    .map((item) => {
      try {
        const json = JSON.parse(item.trim());
        const response = get(json, responsePath);
        return response;
      } catch (e) {
        return '';
      }
    })
    .filter((item) => item)
    .join('');
  return response;
}

export function extractContentFromOllamaChunk(chunk: string): string {
  const response = extractResponseFromChunk(chunk, 'message.content');
  return response;
}

export function extractContentFromSiliconFlowChunk(chunk: string): string {
  let data = chunk.trim();
  const response = data
    .split('data: ')
    .filter(item => item && !item.includes('[DONE]'))
    .map((item) => {
      try {
        const json = JSON.parse(item.trim());
        const delta = json?.choices?.[0]?.delta;
        const response = delta?.content ?? delta?.reasoning_content ?? '';
        return response;
      } catch (e) {
        return '';
      }
    })
    .filter((item) => item)
    .join('');
  return response;
}