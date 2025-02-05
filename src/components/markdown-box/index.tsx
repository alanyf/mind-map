import { Typography } from 'antd';
import markdownIt from 'markdown-it';
import ReactMarkdown from 'react-markdown'
import { useMemo } from 'react';
import './index.less';

const md = markdownIt({ html: true, breaks: true });

export const MarkdownBox = ({ markdown }: { markdown: string }) => {
  const html = useMemo(() => md.render(markdown.replace('</think>', '\n\n</think>\n')), [markdown]);

  return (
    <Typography className="markdown-box-container">
      
    {/* <ReactMarkdown> */}
      {/* {markdown} */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    {/* </ReactMarkdown> */}
    </Typography>
  );
}