
import markdownIt from 'markdown-it';
import React, { useState, useEffect } from 'react';
import './index.less';

const md = markdownIt({ html: true, breaks: true });


const highlightThrottle = (html: string) => {
  if (!html?.includes('<code')) {
    return html;
  }
  const divDom = document.createElement('div');
  divDom.innerHTML = html;
  const codeDoms = Array.from(divDom.querySelectorAll('code') || []);
  const hljs = (window as unknown as { hljs: { highlightElement: (dom: Element) => void } })?.hljs;
  codeDoms.forEach((codeDom) => {
    hljs?.highlightElement(codeDom);
  });
  return divDom.innerHTML;
};

const markdownToHtml = (markdown: string) => {
  const newHtml = md.render(markdown.replace('</think>', '\n\n</think>\n'));
  return highlightThrottle(newHtml);
}

export const MarkdownBox = ({ markdown, style }: { markdown: string; style?: React.CSSProperties }) => {
  const [html, setHtml] = useState('-');

  useEffect(() => {
    const newHtml = markdownToHtml(markdown);
    setHtml(newHtml);
  }, [markdown]);
  return (
    <div style={style} className="markdown-box-container">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}