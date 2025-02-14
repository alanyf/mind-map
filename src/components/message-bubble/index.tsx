import { UserOutlined, OpenAIOutlined, CopyFilled, DownOutlined } from '@ant-design/icons';
/* eslint-disable react/no-danger */
import React from 'react';
import { MarkdownBox } from '../markdown-box';
import { Divider, Dropdown, Menu, message, Radio, Space } from 'antd';

function Bubble({
  content,
  avatar,
  position = 'left',
  contentStyle = {},
}: {
  content?: string;
  avatar?: { icon?: React.ReactNode; src?: string };
  typing?: boolean;
  position?: 'left' | 'right';
  contentStyle?: React.CSSProperties;
}){
  const [renderMode, setRenderMode] = React.useState<'md' | 'txt'>('md');
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
          padding: '6px 8px',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {renderMode === 'md' ? <MarkdownBox markdown={content ?? 'empty'} /> : <pre>{content}</pre>}
        {/* <MarkdownBox markdown={content || 'empty'} /> */}
        <Divider style={{ margin: '6px 0' }} />
        <div>
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span>{content?.length ?? ''}</span>
            <CopyFilled
              style={{ cursor: 'pointer', color: '#888', marginLeft: 'auto' }}
              onClick={() => {
                navigator.clipboard.writeText(content!).then(() => {
                  message.success('复制成功');
                }).catch(() => {
                  message.error('复制失败');
                });
              }}
            />
            <Dropdown
              mouseEnterDelay={0}
              overlay={
                <Menu>
                  {['md', 'txt'].map((mode) => 
                    <Menu.Item
                      key={mode}
                      onClick={() =>  setRenderMode(mode as 'md' | 'txt')}
                    >
                    {mode}
                    </Menu.Item>
                  )}
                </Menu>
              }
            >
              <Space size="small" style={{ backgroundColor: '#0001', padding: '0 4px', borderRadius: 4 }}>
                {renderMode}
                <DownOutlined style={{ fontSize: 10 }} />
              </Space>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ role, content }: { role?: string; content: string }) {
  return (
    <Bubble
      typing
      content={content}
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
        <React.Fragment key={index + message.role}>
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