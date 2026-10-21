import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, Room } from '../types';
import { socketUrl } from '../lib/utils';

export type ConnectionStatus = 'idle' | 'connecting' | 'online' | 'offline';

interface TypingUser {
  username: string;
  until: number;
}

const TOKEN_KEY = 'suhbat.token';
const USER_KEY = 'suhbat.username';
const ROOM_KEY = 'suhbat.room';

export interface ServerEvent {
  type: string;
  [key: string]: unknown;
}

export function useChat() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [me, setMe] = useState<string | null>(() => localStorage.getItem(USER_KEY));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [presence, setPresence] = useState<Record<string, string[]>>({});
  const [typing, setTyping] = useState<Record<string, TypingUser[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const usernameRef = useRef('');
  const manualCloseRef = useRef(false);
  const attemptRef = useRef(0);
  const reconnectRef = useRef<number | null>(null);
  const lastTypingRef = useRef(0);
  const errorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), 4000);
  }, []);

  const connect = useCallback(
    (username: string) => {
      usernameRef.current = username;
      manualCloseRef.current = false;
      setStatus('connecting');
      setAuthError(null);

      let socket: WebSocket;
      try {
        socket = new WebSocket(socketUrl());
      } catch {
        setStatus('offline');
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        socket.send(
          JSON.stringify({
            type: 'auth',
            username,
            token: localStorage.getItem(TOKEN_KEY) ?? '',
            roomId: localStorage.getItem(ROOM_KEY) ?? '',
          }),
        );
      };

      socket.onmessage = (event) => {
        let data: ServerEvent;
        try {
          data = JSON.parse(String(event.data));
        } catch {
          return;
        }

        switch (data.type) {
          case 'ready': {
            const user = data.user as { username: string };
            const roomList = (data.rooms as Room[]) ?? [];
            setStatus('online');
            setMe(user.username);
            localStorage.setItem(USER_KEY, user.username);
            if (typeof data.token === 'string') localStorage.setItem(TOKEN_KEY, data.token);
            setRooms(roomList);
            break;
          }
          case 'rooms': {
            setRooms((data.rooms as Room[]) ?? []);
            break;
          }
          case 'joined': {
            const room = data.room as Room;
            const history = (data.messages as Message[]) ?? [];
            setActiveRoomId(room.id);
            activeRoomRef.current = room.id;
            localStorage.setItem(ROOM_KEY, room.id);
            setMessages((prev) => ({ ...prev, [room.id]: history }));
            setPresence((prev) => ({ ...prev, [room.id]: (data.presence as string[]) ?? [] }));
            setUnread((prev) => ({ ...prev, [room.id]: 0 }));
            break;
          }
          case 'message': {
            const message = data.message as Message;
            setMessages((prev) => {
              const list = prev[message.roomId] ?? [];
              if (list.some((item) => item.id === message.id)) return prev;
              return { ...prev, [message.roomId]: [...list, message] };
            });
            if (message.roomId !== activeRoomRef.current && message.username !== usernameRef.current) {
              setUnread((prev) => ({ ...prev, [message.roomId]: (prev[message.roomId] ?? 0) + 1 }));
            }
            break;
          }
          case 'presence': {
            setPresence((prev) => ({ ...prev, [String(data.roomId)]: (data.users as string[]) ?? [] }));
            break;
          }
          case 'typing': {
            const roomId = String(data.roomId);
            const username = String(data.username);
            setTyping((prev) => {
              const now = Date.now();
              const list = (prev[roomId] ?? []).filter(
                (item) => item.username !== username && item.until > now,
              );
              return { ...prev, [roomId]: [...list, { username, until: now + 3200 }] };
            });
            break;
          }
          case 'auth_error': {
            manualCloseRef.current = true;
            setStatus('idle');
            setMe(null);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TOKEN_KEY);
            setAuthError(String(data.message ?? 'Kirishda xatolik yuz berdi'));
            socket.close();
            break;
          }
          case 'error': {
            showError(String(data.message ?? 'Xatolik yuz berdi'));
            break;
          }
          default:
            break;
        }
      };

      socket.onclose = () => {
        const isCurrent = socketRef.current === socket;
        if (isCurrent) socketRef.current = null;
        if (!isCurrent || manualCloseRef.current) {
          if (isCurrent) setStatus('idle');
          return;
        }
        setStatus('offline');
        const delay = Math.min(800 * 2 ** attemptRef.current, 8000);
        attemptRef.current += 1;
        reconnectRef.current = window.setTimeout(() => {
          if (usernameRef.current) connect(usernameRef.current);
        }, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    },
    [showError],
  );

  useEffect(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) connect(saved);
    return () => {
      manualCloseRef.current = true;
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTyping((prev) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, TypingUser[]> = {};
        for (const [roomId, list] of Object.entries(prev)) {
          const filtered = list.filter((item) => item.until > now);
          if (filtered.length !== list.length) changed = true;
          if (filtered.length > 0) next[roomId] = filtered;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const login = useCallback(
    (raw: string) => {
      const username = raw.replace(/\s+/g, ' ').trim().slice(0, 20);
      if (username.length < 2) {
        setAuthError("Ism kamida 2 ta belgidan iborat bo'lsin");
        return;
      }
      setAuthError(null);
      connect(username);
    },
    [connect],
  );

  const logout = useCallback(() => {
    manualCloseRef.current = true;
    if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
    socketRef.current?.close();
    socketRef.current = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setMe(null);
    setStatus('idle');
    setRooms([]);
    setActiveRoomId(null);
    setMessages({});
    setPresence({});
    setTyping({});
    setUnread({});
    setError(null);
  }, []);

  const selectRoom = useCallback((roomId: string) => {
    if (roomId === activeRoomRef.current) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'join_room', roomId }));
  }, []);

  const createRoom = useCallback(
    (raw: string) => {
      const name = raw.replace(/\s+/g, ' ').trim().slice(0, 30);
      if (name.length < 2) {
        showError("Xona nomi kamida 2 ta belgidan iborat bo'lsin");
        return false;
      }
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify({ type: 'create_room', name }));
      return true;
    },
    [showError],
  );

  const sendMessage = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return false;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showError('Ulanish yo\'q. Qayta ulanmoqda...');
      return false;
    }
    socket.send(JSON.stringify({ type: 'message', text: text.slice(0, 2000) }));
    return true;
  }, [showError]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < 1500) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    lastTypingRef.current = now;
    socket.send(JSON.stringify({ type: 'typing' }));
  }, []);

  return {
    status,
    me,
    rooms,
    activeRoomId,
    messages,
    presence,
    typing,
    unread,
    error,
    authError,
    login,
    logout,
    selectRoom,
    createRoom,
    sendMessage,
    notifyTyping,
  };
}

export type ChatController = ReturnType<typeof useChat>;
