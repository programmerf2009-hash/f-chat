export interface Room {
  id: string;
  name: string;
  createdAt: number;
  createdBy?: string;
}

export interface Message {
  id: string;
  roomId: string;
  username: string;
  text: string;
  ts: number;
}
