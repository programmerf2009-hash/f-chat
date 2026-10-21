import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Store } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 3001);

const store = new Store(
  process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR, 'db.json')
    : path.join(__dirname, '..', 'data', 'db.json'),
);

const app = express();
app.disable('x-powered-by');
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: store.rooms().length, uptime: Math.round(process.uptime()) });
});

const clientDist = path.join(ROOT, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

/** ws -> { username, roomId, times: number[] } */
const clients = new Map();

const MAX_TEXT = 2000;
const HISTORY = 100;
const FLOOD_WINDOW = 5000;
const FLOOD_LIMIT = 8;

const cleanName = (value, max) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function broadcast(payload, filter = () => true) {
  for (const client of wss.clients) {
    if (client.readyState === 1 && filter(client)) send(client, payload);
  }
}

function broadcastRoom(roomId, payload, filter = () => true) {
  broadcast(payload, (client) => clients.get(client)?.roomId === roomId && filter(client));
}

function presenceList(roomId) {
  const users = new Set();
  for (const info of clients.values()) {
    if (info.roomId === roomId) users.add(info.username);
  }
  return [...users].sort((a, b) => a.localeCompare(b));
}

function broadcastPresence(roomId) {
  broadcastRoom(roomId, { type: 'presence', roomId, users: presenceList(roomId) });
}

function broadcastRooms() {
  broadcast({ type: 'rooms', rooms: store.rooms() });
}

function joinRoom(ws, info, roomId) {
  const room = store.getRoom(roomId);
  if (!room) {
    send(ws, { type: 'error', message: 'Bunday xona topilmadi' });
    return;
  }

  const previous = info.roomId;
  info.roomId = room.id;

  send(ws, {
    type: 'joined',
    room,
    messages: store.history(room.id, HISTORY),
    presence: presenceList(room.id),
  });

  if (previous && previous !== room.id) broadcastPresence(previous);
  broadcastPresence(room.id);
}

wss.on('connection', (ws) => {
  let info = null;

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!data || typeof data !== 'object') return;

    if (data.type === 'auth') {
      const username = cleanName(data.username, 20);
      if (username.length < 2) {
        send(ws, { type: 'auth_error', message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" });
        return;
      }

      let session = store.getSession(typeof data.token === 'string' ? data.token : '');
      if (!session || session.username.toLowerCase() !== username.toLowerCase()) {
        session = { token: randomUUID(), username };
        store.setSession(session.token, session.username);
      }

      info = { username: session.username, roomId: null, times: [] };
      clients.set(ws, info);

      send(ws, {
        type: 'ready',
        user: { username: info.username },
        token: session.token,
        rooms: store.rooms(),
      });

      const wanted = store.getRoom(cleanName(data.roomId, 40));
      joinRoom(ws, info, wanted ? wanted.id : store.rooms()[0].id);
      return;
    }

    if (!info) {
      send(ws, { type: 'error', message: 'Avval tizimga kiring' });
      return;
    }

    if (data.type === 'message') {
      const text = cleanText(data.text, MAX_TEXT);
      if (!text) return;

      const now = Date.now();
      info.times = info.times.filter((time) => now - time < FLOOD_WINDOW);
      if (info.times.length >= FLOOD_LIMIT) {
        send(ws, { type: 'error', message: "Juda tez yozmoqdasiz, bir oz kuting" });
        return;
      }
      info.times.push(now);

      const message = store.addMessage({
        id: randomUUID(),
        roomId: info.roomId,
        username: info.username,
        text,
        ts: now,
      });

      broadcastRoom(info.roomId, { type: 'message', message });
      return;
    }

    if (data.type === 'typing') {
      broadcastRoom(info.roomId, { type: 'typing', roomId: info.roomId, username: info.username }, (client) => client !== ws);
      return;
    }

    if (data.type === 'join_room') {
      joinRoom(ws, info, cleanName(data.roomId, 40));
      return;
    }

    if (data.type === 'create_room') {
      const name = cleanName(data.name, 30);
      if (name.length < 2) {
        send(ws, { type: 'error', message: "Xona nomi kamida 2 ta belgidan iborat bo'lsin" });
        return;
      }
      if (store.findRoomByName(name)) {
        send(ws, { type: 'error', message: 'Bunday nomdagi xona allaqachon bor' });
        return;
      }
      const room = store.addRoom({
        id: randomUUID(),
        name,
        createdAt: Date.now(),
        createdBy: info.username,
      });
      broadcastRooms();
      joinRoom(ws, info, room.id);
      return;
    }
  });

  ws.on('close', () => {
    const oldRoom = info?.roomId;
    clients.delete(ws);
    if (oldRoom) broadcastPresence(oldRoom);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Suhbat server: http://localhost:${PORT}`);
  console.log(`WebSocket:     ws://localhost:${PORT}/ws`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    store.flush();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
