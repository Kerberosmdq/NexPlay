"use client";

import type { PlaceholderState, PlaceholderAction } from "../reducer";

export interface PlayerViewProps {
  state: PlaceholderState;
  playerId: string;
  roomCode: string;
  dispatch: (action: PlaceholderAction) => void;
}

export function PlayerView({ state, playerId, roomCode, dispatch }: PlayerViewProps) {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">Sala / Room</span>
          <h2 className="text-3xl font-extrabold tracking-widest text-indigo-400">{roomCode}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400">Rol</span>
          <span className="block text-sm font-semibold text-sky-400">🎮 Jugador (Player)</span>
        </div>
      </div>

      <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-800">
        <span className="text-xs font-medium uppercase text-slate-400 tracking-wider">Estado de la Ronda</span>
        <div className="text-6xl font-black text-white my-2">{state.count}</div>
        <p className="text-sm text-slate-400">
          {state.phase === "lobby" && "Esperando que el anfitrión inicie el juego..."}
          {state.phase === "in-round" && "¡Juego en progreso! Usa los botones para cambiar el contador."}
          {state.phase === "results" && "¡Ronda finalizada!"}
        </p>
      </div>

      {state.phase === "in-round" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => dispatch({ type: "DECREMENT", playerId })}
            className="py-4 bg-red-600/80 hover:bg-red-500 font-bold rounded-xl text-white text-xl active:scale-95 transition-transform"
          >
            - 1
          </button>
          <button
            onClick={() => dispatch({ type: "INCREMENT", playerId })}
            className="py-4 bg-emerald-600/80 hover:bg-emerald-500 font-bold rounded-xl text-white text-xl active:scale-95 transition-transform"
          >
            + 1
          </button>
        </div>
      )}
    </div>
  );
}
