export interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  joinedAt: number;
  isOnline: boolean;
}

export interface RoomState {
  code: string;
  hostUserId: string;
  players: Player[];
  createdAt: number;
}

export interface PresencePayload {
  userId: string;
  displayName: string;
  joinedAt: number;
}
