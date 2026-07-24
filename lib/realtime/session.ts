export interface RoomSession {
  mode: "single-device" | "multi-device";
  role: "host" | "player";
  roomCode: string;
  userId: string;
  displayName: string;
}

const STORAGE_KEY = "nexplay:room-session:v1";

/** Only multi-device sessions are worth remembering — single-device is a
 * local pass-and-play game with no server-side room to rejoin, and its
 * in-progress state isn't persisted either. This is specifically the fix
 * for "the connection dropped and nobody wrote down the room code": the
 * same device can silently rejoin the same room via presence, without the
 * player re-typing anything. */
export function saveRoomSession(session: RoomSession): void {
  if (session.mode !== "multi-device") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private browsing, quota) — losing the
    // "remember me" convenience isn't worth crashing the app over.
  }
}

export function loadRoomSession(): RoomSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.mode === "single-device" || parsed.mode === "multi-device") &&
      (parsed.role === "host" || parsed.role === "player") &&
      typeof parsed.roomCode === "string" &&
      typeof parsed.userId === "string" &&
      typeof parsed.displayName === "string"
    ) {
      return parsed as RoomSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
