import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_MESSAGES = 5000;

/**
 * Oddiy faylga asoslangan saqlash qatlami.
 * Ma'lumotlar bitta JSON faylda saqlanadi (MVP uchun yetarli).
 */
export class Store {
  #file;
  #timer = null;
  data = { rooms: [], messages: [], sessions: {} };

  constructor(file) {
    this.#file = file;
    this.#load();
  }

  #load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.#file, 'utf8'));
      this.data = {
        rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      };
    } catch {
      this.data = { rooms: [], messages: [], sessions: {} };
    }

    if (this.data.rooms.length === 0) {
      const general = {
        id: randomUUID(),
        name: 'Umumiy',
        createdAt: Date.now(),
        createdBy: 'ChatBot',
      };
      this.data.rooms.push(general);
      this.data.messages.push({
        id: randomUUID(),
        roomId: general.id,
        username: 'ChatBot',
        text: "Salom! Bu Suhbat ilovasining birinchi xonasi. Havolani do'stlaringizga yuboring va birga sinab ko'ring.",
        ts: Date.now(),
      });
      this.#saveNow();
    }
  }

  #saveNow() {
    try {
      fs.mkdirSync(path.dirname(this.#file), { recursive: true });
      const tmp = `${this.#file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.#file);
    } catch (error) {
      console.error('[store] saqlashda xatolik:', error.message);
    }
  }

  save() {
    if (this.#timer) return;
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#saveNow();
    }, 250);
    this.#timer.unref?.();
  }

  flush() {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#saveNow();
  }

  rooms() {
    return this.data.rooms;
  }

  getRoom(id) {
    return this.data.rooms.find((room) => room.id === id);
  }

  findRoomByName(name) {
    const needle = name.trim().toLowerCase();
    return this.data.rooms.find((room) => room.name.trim().toLowerCase() === needle);
  }

  addRoom(room) {
    this.data.rooms.push(room);
    this.save();
    return room;
  }

  addMessage(message) {
    this.data.messages.push(message);
    const overflow = this.data.messages.length - MAX_MESSAGES;
    if (overflow > 0) this.data.messages.splice(0, overflow);
    this.save();
    return message;
  }

  history(roomId, limit = 100) {
    return this.data.messages.filter((message) => message.roomId === roomId).slice(-limit);
  }

  getSession(token) {
    if (!token) return null;
    const username = this.data.sessions[token];
    return username ? { token, username } : null;
  }

  setSession(token, username) {
    this.data.sessions[token] = username;
    this.save();
  }
}
