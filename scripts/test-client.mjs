/**
 * Ikkinchi foydalanuvchini taqlid qiluvchi kichik test klienti.
 * Ishlatish: node scripts/test-client.mjs [ism] [server-url]
 */
import WebSocket from 'ws';

const username = process.argv[2] ?? 'TestBot';
const url = process.argv[3] ?? 'ws://localhost:3001/ws';

const ws = new WebSocket(url);
const events = [];

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'auth', username, token: '', roomId: '' }));
});

ws.on('message', (raw) => {
  const data = JSON.parse(raw);
  events.push(data.type);

  if (data.type === 'ready') {
    console.log('READY rooms:', data.rooms.map((room) => room.name).join(', '));
  }
  if (data.type === 'joined') {
    console.log('JOINED:', data.room.name, '| tarix:', data.messages.length, '| onlayn:', data.presence.join(', '));
    ws.send(JSON.stringify({ type: 'message', text: `Salom! Men ${username}.` }));
  }
  if (data.type === 'message') {
    console.log('MESSAGE:', data.message.username, '->', data.message.text);
  }
  if (data.type === 'error' || data.type === 'auth_error') {
    console.log('ERROR:', data.message);
  }
});

setTimeout(() => {
  console.log('EVENTS:', [...new Set(events)].join(', '));
  ws.close();
  process.exit(0);
}, 2500);
