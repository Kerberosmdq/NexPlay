export type Side = "A" | "B";
// "config" only exists when `setup()` didn't already receive two real
// player ids — single-device always starts here (the platform calls
// `setup([])`, same as every other game with a single-device mode).
// Multi-device's two already-connected players skip straight to
// "selecting" — each side privately picks *which* character they'll be
// (founder feedback, 2026-07-28: this used to be auto-assigned at random,
// but the real game is choosing your own character, not being handed one).
// Single-device handles its own equivalent pick-and-pass loop entirely in
// its own view, outside the reducer, so it never visits "selecting" —
// it dispatches START_MATCH only once both local players have chosen.
export type GuessWhoPhase = "config" | "selecting" | "playing" | "resolution";

export interface GuessWhoState {
  phase: GuessWhoPhase;
  sides: Record<Side, string>;
  // "selecting" only: which sides have confirmed their character choice.
  // Never carries the character itself — same ADR-0005 shape as
  // Battleship's `readySides` during "placing" (a side's own pick stays in
  // its private slice; the room only ever learns "this side is ready").
  readySides: Record<Side, boolean>;
  // A guess has been made but not yet resolved — the guessed-about side's
  // own device answers this via `answerPending` (ADR-0005 §3), comparing
  // against its own private secret character. While set, no new guess may
  // be made.
  pendingGuess: { guesserSide: Side; characterId: string } | null;
  winnerSide: Side | null;
  // Filled in only once the match reaches "resolution" — the character
  // that was never shared state up to that point becomes visible then,
  // same ADR-0005 §3 exception Battleship's `revealedFleets` already uses.
  revealedCharacters: Partial<Record<Side, string>>;
}

// A side's own secret character never enters shared state — this lives
// only in that device's private slice (ADR-0005), mirrored to
// localStorage, exactly like a Battleship fleet.
export interface GuessWhoPrivate {
  myCharacterId: string | null;
}

export type GuessWhoAction =
  | { type: "START_MATCH"; playerIds: [string, string] }
  // No character id here — choosing is a purely private act (ADR-0005 §2);
  // the room only ever learns that a side has locked in *a* choice.
  | { type: "CONFIRM_CHARACTER"; side: Side }
  | { type: "GUESS"; guesserSide: Side; characterId: string }
  | { type: "RESOLVE_GUESS"; correct: boolean }
  | { type: "REVEAL_CHARACTER"; side: Side; characterId: string }
  | { type: "PLAY_AGAIN" };

export function otherSide(side: Side): Side {
  return side === "A" ? "B" : "A";
}

export function createInitialState(playerIds: string[]): GuessWhoState {
  const [playerA, playerB] = playerIds;
  const readyToPlay = playerIds.length === 2;
  return {
    phase: readyToPlay ? "selecting" : "config",
    sides: { A: playerA ?? "", B: playerB ?? "" },
    readySides: { A: false, B: false },
    pendingGuess: null,
    winnerSide: null,
    revealedCharacters: {},
  };
}

/** ADR-0005 §2/§3: the guessed-about side's own device is the only one
 * that can honestly answer "is this who I am" — its private
 * `myCharacterId` never reaches shared state until resolution. Pure:
 * `privateState` arrives as an explicit argument, never read ambiently,
 * matching `answerPendingShot`'s same shape (this task's second real use
 * of the pattern). */
export function answerPendingGuess(
  state: GuessWhoState,
  privateState: GuessWhoPrivate,
  playerId: string
): GuessWhoAction | null {
  if (!state.pendingGuess) return null;

  const targetSide = otherSide(state.pendingGuess.guesserSide);
  if (state.sides[targetSide] !== playerId) return null; // not the guessed-about side's own device
  if (privateState.myCharacterId === null) return null; // not yet privately assigned

  const correct = privateState.myCharacterId === state.pendingGuess.characterId;
  return { type: "RESOLVE_GUESS", correct };
}

export function guessWhoReducer(state: GuessWhoState, action: GuessWhoAction): GuessWhoState {
  switch (action.type) {
    case "START_MATCH": {
      if (state.phase !== "config") return state;
      const [playerA, playerB] = action.playerIds;
      return { ...state, phase: "selecting", sides: { A: playerA, B: playerB }, readySides: { A: false, B: false } };
    }

    case "CONFIRM_CHARACTER": {
      if (state.phase !== "selecting") return state;
      const readySides = { ...state.readySides, [action.side]: true };
      const bothReady = readySides.A && readySides.B;
      return { ...state, readySides, phase: bothReady ? "playing" : "selecting" };
    }

    case "GUESS": {
      if (state.phase !== "playing") return state;
      if (state.pendingGuess) return state; // a guess is already awaiting resolution
      return { ...state, pendingGuess: { guesserSide: action.guesserSide, characterId: action.characterId } };
    }

    case "RESOLVE_GUESS": {
      if (!state.pendingGuess) return state;
      const winnerSide = action.correct ? state.pendingGuess.guesserSide : otherSide(state.pendingGuess.guesserSide);
      return { ...state, phase: "resolution", pendingGuess: null, winnerSide };
    }

    case "REVEAL_CHARACTER": {
      if (state.phase !== "resolution") return state;
      return { ...state, revealedCharacters: { ...state.revealedCharacters, [action.side]: action.characterId } };
    }

    case "PLAY_AGAIN": {
      if (state.phase !== "resolution") return state;
      // Back to "selecting", not straight to "playing" — a rematch means
      // choosing again, same as the first match; also naturally closes the
      // stale-character bug ADR-0005 v1.4.0 documented (a device's own view
      // clears its private slice on re-entering "selecting").
      return {
        ...state,
        phase: "selecting",
        readySides: { A: false, B: false },
        pendingGuess: null,
        winnerSide: null,
        revealedCharacters: {},
      };
    }

    default:
      return state;
  }
}
