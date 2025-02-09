import { UserOutlined, OpenAIOutlined } from '@ant-design/icons';
/* eslint-disable react/no-danger */
import React from 'react';
import { MarkdownBox } from '../markdown-box';

const renderMarkdown = (content: string) => <MarkdownBox markdown={content} />;

function Bubble({
  content,
  messageRender,
  avatar,
  position = 'left',
  contentStyle = {},
}: {
  content?: string;
  messageRender?: (content: string) => React.ReactNode;
  avatar?: { icon?: React.ReactNode; src?: string };
  typing?: boolean;
  position?: 'left' | 'right';
  contentStyle?: React.CSSProperties;
}){
  const avatarJsx = (
    avatar?.icon ? <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 16,
      background: '#f0f0f0',
      flexShrink: 0,
      flexGrow: 0,
    }}>{avatar.icon}</div>: null
  );
  return (
    <div style={{
      display: 'flex', 
      overflow: 'hidden',
      width: '100%',
      flexDirection: position === 'left' ? 'row' : 'row-reverse',
      gap: 8,
    }}>
      {avatarJsx}
      <div
        style={{
          backgroundColor: '#f0f0f0',
          ...contentStyle,
          padding: '4px 8px',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {typeof messageRender === 'function' ? messageRender(content!) : content}
      </div>
    </div>
  );
}

export function MessageBubble({ role, content }: { role?: string; content: string }) {
  return (
    <Bubble
      typing
      content={content}
      messageRender={renderMarkdown}
      avatar={{ icon: role === 'assistant' ? <OpenAIOutlined /> : <UserOutlined /> }}
      position={role === 'assistant' ? 'left' : 'right'}
      contentStyle={{
        backgroundColor: role === 'assistant' ? '#f0f0f0' : '#e9f4fe',
      }}
    />
  );
};

export interface Message {
  role: string;
  content: string;
}
export function ChatMessages({
  messages = []
}: { messages: Message[] }) {
  return (
    <div style={{
      overflow: 'hidden',
      width: '100%',
    }}>
      {messages.map((message, index) => (
        <React.Fragment key={index + message.role + message.content}>
          <MessageBubble
            role={message.role}
            content={message.content}
          />
          <div style={{ height: 12 }} />
        </React.Fragment>
      ))}
    </div>
  );
}