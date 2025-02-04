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
}: {
  content?: string;
  messageRender?: (content: string) => React.ReactNode;
  avatar?: { icon?: React.ReactNode; src?: string };
  typing?: boolean;
  position?: 'left' | 'right';
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
          padding: '4px 8px',
          background: '#f0f0f0',
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
    />
  );
};

export function ChatMessages({
  messages = []
}: { messages: { role: string; content: string }[] }) {
  return (
    <div style={{
      // gap: 12,
      overflow: 'hidden',
      width: '100%',
    }}>
      {messages.map((message, index) => (
        <React.Fragment key={index + message.role + message.content}>
          <MessageBubble
            role={message.role}
            content={message.content}
          />
          <div style={{ height: 8 }} />
        </React.Fragment>
      ))}
    </div>
  );
}