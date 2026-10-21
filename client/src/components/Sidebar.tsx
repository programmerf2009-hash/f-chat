import { useState, type FormEvent } from 'react';
import type { ChatController } from '../hooks/useChat';
import { Avatar } from './Avatar';

interface SidebarProps {
  chat: ChatController;
  open: boolean;
  onClose: () => void;
}

const statusLabel: Record<ChatController['status'], string> = {
  idle: 'Kutilmoqda',
  connecting: 'Ulanmoqda',
  online: 'Onlayn',
  offline: 'Oflayn',
};

export function Sidebar({ chat, open, onClose }: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');

  const onlineUsers = chat.activeRoomId ? (chat.presence[chat.activeRoomId] ?? []) : [];

  const submitRoom = (event: FormEvent) => {
    event.preventDefault();
    if (chat.createRoom(roomName)) {
      setRoomName('');
      setCreating(false);
    }
  };

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span className="brand-name">Suhbat</span>
        </div>
        <button className="icon-btn sidebar-close" type="button" onClick={onClose} aria-label="Yopish">
          ✕
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-head">
          <span className="section-title">Xonalar</span>
          <button
            className="icon-btn"
            type="button"
            onClick={() => setCreating((value) => !value)}
            aria-label="Yangi xona"
            title="Yangi xona"
          >
            +
          </button>
        </div>

        {creating ? (
          <form className="room-form" onSubmit={submitRoom}>
            <input
              className="input input-sm"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Xona nomi"
              maxLength={30}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={roomName.trim().length < 2}>
              Yaratish
            </button>
          </form>
        ) : null}

        <nav className="room-list">
          {chat.rooms.map((room) => {
            const active = room.id === chat.activeRoomId;
            const count = chat.unread[room.id] ?? 0;
            return (
              <button
                key={room.id}
                type="button"
                className={`room ${active ? 'room-active' : ''}`}
                onClick={() => {
                  chat.selectRoom(room.id);
                  onClose();
                }}
              >
                <span className="room-hash">#</span>
                <span className="room-name">{room.name}</span>
                {count > 0 && !active ? <span className="badge">{count > 99 ? '99+' : count}</span> : null}
              </button>
            );
          })}
          {chat.rooms.length === 0 ? <p className="muted small">Xonalar yuklanmoqda...</p> : null}
        </nav>
      </div>

      <div className="sidebar-section sidebar-online">
        <div className="section-head">
          <span className="section-title">
            Onlayn <span className="section-count">{onlineUsers.length}</span>
          </span>
        </div>
        <ul className="online-list">
          {onlineUsers.map((user) => (
            <li key={user} className="online-item">
              <Avatar name={user} size="sm" />
              <span className="online-name">
                {user}
                {user === chat.me ? <span className="you"> (siz)</span> : null}
              </span>
              <span className="dot" />
            </li>
          ))}
          {onlineUsers.length === 0 ? <li className="muted small">Hozircha hech kim yo'q</li> : null}
        </ul>
      </div>

      <div className="profile">
        <Avatar name={chat.me ?? '?'} online={chat.status === 'online'} />
        <div className="profile-info">
          <span className="profile-name">{chat.me ?? 'Mehmon'}</span>
          <span className={`profile-status status-${chat.status}`}>{statusLabel[chat.status]}</span>
        </div>
        <button className="icon-btn" type="button" onClick={chat.logout} title="Chiqish" aria-label="Chiqish">
          ⎋
        </button>
      </div>
    </aside>
  );
}
