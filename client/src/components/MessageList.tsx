import { useEffect, useRef, type ReactNode } from 'react';
import type { Message } from '../types';
import { formatDay, formatTime } from '../lib/utils';
import { Avatar } from './Avatar';

interface MessageListProps {
  messages: Message[];
  me: string;
  typingUsers: string[];
  roomName: string;
}

export function MessageList({ messages, me, typingUsers, roomName }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length, roomName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [typingUsers.length]);

  const nodes: ReactNode[] = [];
  let lastDay = '';
  let previous: Message | null = null;

  for (const message of messages) {
    const date = new Date(message.ts);
    const dayKey = date.toDateString();
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      previous = null;
      nodes.push(
        <div className="date-sep" key={`day-${dayKey}`}>
          <span>{formatDay(message.ts)}</span>
        </div>,
      );
    }

    const mine = message.username === me;
    const grouped = Boolean(
      previous &&
        previous.username === message.username &&
        message.ts - previous.ts < 5 * 60 * 1000,
    );

    nodes.push(
      <div className={`msg ${mine ? 'msg-mine' : 'msg-theirs'} ${grouped ? 'msg-grouped' : ''}`} key={message.id}>
        {!mine ? (
          <div className="msg-avatar-slot">
            {!grouped ? <Avatar name={message.username} size="sm" /> : null}
          </div>
        ) : null}
        <div className="msg-content">
          {!mine && !grouped ? <span className="msg-author">{message.username}</span> : null}
          <div className="bubble">
            <span className="bubble-text">{message.text}</span>
            <span className="bubble-time">{formatTime(message.ts)}</span>
          </div>
        </div>
      </div>,
    );

    previous = message;
  }

  return (
    <div className="messages" ref={containerRef}>
      <div className="messages-inner">
        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">#</div>
            <h2>{roomName}</h2>
            <p>Bu xonada hozircha xabar yo'q. Birinchi bo'lib yozing!</p>
          </div>
        ) : (
          nodes
        )}

        {typingUsers.length > 0 ? (
          <div className="typing">
            <span className="typing-dots">
              <i />
              <i />
              <i />
            </span>
            {typingUsers.length === 1
              ? `${typingUsers[0]} yozmoqda...`
              : `${typingUsers.slice(0, 2).join(', ')} yozmoqda...`}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
