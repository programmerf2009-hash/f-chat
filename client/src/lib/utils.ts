export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function avatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }
  return `hsl(${hash} 62% 46%)`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Bugun';
  if (sameDay(date, yesterday)) return 'Kecha';
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function socketUrl(): string {
  const configured = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (configured) {
    const base = configured.replace(/\/+$/, '').replace(/^http/, 'ws');
    return base.endsWith('/ws') ? base : `${base}/ws`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
}

export function roomInitial(name: string): string {
  return (name.trim()[0] ?? '#').toUpperCase();
}
