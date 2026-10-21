import { useState } from 'react';
import type { ChatController } from '../hooks/useChat';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { Sidebar } from './Sidebar';

interface ChatScreenProps {
  chat: ChatController;
}

const statusText: Record<ChatController['status'], string> = {
  idle: 'Kutilmoqda',
  connecting: 'Ulanmoqda...',
  online: 'Onlayn',
  offline: 'Ulanish uzildi',
};

export function ChatScreen({ chat }: ChatScreenProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeRoom = chat.rooms.find((room) => room.id === chat.activeRoomId);
  const roomId = chat.activeRoomId;
  const roomMessages = roomId ? (chat.messages[roomId] ?? []) : [];
  const online = roomId ? (chat.presence[roomId] ?? []) : [];
  const typingUsers = (roomId ? (chat.typing[roomId] ?? []) : [])
    .map((item) => item.username)
    .filter((username) => username !== chat.me);

  return (
    <div className="app">
      <div className="shell">
        <Sidebar chat={chat} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen ? (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Yopish"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <main className="chat">
          <header className="chat-header">
            <button
              type="button"
              className="icon-btn menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Xonalar"
            >
              ☰
            </button>
            <div className="chat-title">
              <h1>
                <span className="hash">#</span>
                {activeRoom?.name ?? 'Xona tanlanmagan'}
              </h1>
              <p className="chat-subtitle">
                {online.length} onlayn
                {activeRoom?.createdBy ? ` · ${activeRoom.createdBy} yaratgan` : ''}
              </p>
            </div>
            <span className={`pill pill-${chat.status}`}>
              <span className="pill-dot" />
              {statusText[chat.status]}
            </span>
          </header>

          {chat.status !== 'online' ? (
            <div className="banner">
              {chat.status === 'offline'
                ? "Server bilan aloqa uzildi. Qayta ulanishga harakat qilinyapti..."
                : 'Serverga ulanmoqda...'}
            </div>
          ) : null}

          <MessageList
            messages={roomMessages}
            me={chat.me ?? ''}
            typingUsers={typingUsers}
            roomName={activeRoom?.name ?? 'Xona'}
          />

          <div className="composer-wrap">
            <Composer
              disabled={chat.status !== 'online' || !roomId}
              onSend={chat.sendMessage}
              onTyping={chat.notifyTyping}
            />
            <p className="composer-hint">
              {chat.error ? (
                <span className="composer-error">{chat.error}</span>
              ) : (
                "Xabarlar serverda saqlanadi. Yuborish uchun Enter."
              )}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
