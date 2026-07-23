"use client";

import type { PlaceholderState, PlaceholderAction } from "../reducer";
import type { Player } from "@/lib/types/room";

export interface HostViewProps {
  state: PlaceholderState;
  players: Player[];
  roomCode: string;
  dispatch: (action: PlaceholderAction) => void;
}

export function HostView({ state, players, roomCode, dispatch }: HostViewProps) {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">Sala / Room</span>
          <h2 className="text-3xl font-extrabold tracking-widest text-indigo-400">{roomCode}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400">Rol</span>
          <span className="block text-sm font-semibold text-emerald-400">👑 Anfitrión (Host)</span>
        </div>
      </div>

      <div className="text-center py-6 bg-slate-950/60 rounded-xl border border-slate-800">
        <span className="text-xs font-medium uppercase text-slate-400 tracking-wider">Contador Compartido</span>
        <div className="text-6xl font-black text-white my-2">{state.count}</div>
        <span className="text-xs text-slate-400">
          Fase: <strong className="text-indigo-300 capitalize">{state.phase}</strong>
        </span>
      </div>

      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white shadow-lg transition-transform active:scale-95"
        >
          🚀 Comenzar Juego / Start Match
        </button>
      )}

      {state.phase === "in-round" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch({ type: "DECREMENT" })}
              className="py-3 bg-red-600/80 hover:bg-red-500 font-bold rounded-xl text-white"
            >
              - 1
            </button>
            <button
              onClick={() => dispatch({ type: "INCREMENT" })}
              className="py-3 bg-emerald-600/80 hover:bg-emerald-500 font-bold rounded-xl text-white"
            >
              + 1
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white"
          >
            🏁 Finalizar Ronda / Finish
          </button>
        </div>
      )}

      {state.phase === "results" && (
        <button
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-white"
        >
          🔄 Reiniciar Sala / Reset
        </button>
      )}

      <div className="border-t border-slate-800 pt-4">
        <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">
          Jugadores Conectados ({players.length})
        </h4>
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm py-1.5 px-3 bg-slate-800/50 rounded-lg"
            >
              <span>{p.displayName} {p.isHost ? "👑" : ""}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${p.isOnline ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                {p.isOnline ? "En línea" : "Desconectado"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
