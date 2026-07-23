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
    <div className="w-full max-w-md mx-auto p-6 bg-[#180c35] text-white rounded-3xl border-2 border-[#3c1e78] shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#2c145a] pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Código de Sala</span>
          <h2 className="text-3xl font-black tracking-widest text-amber-400 drop-shadow-[0_2px_0_#92400e]">{roomCode}</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tu Rol</span>
          <span className="block text-xs font-black px-3 py-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 rounded-full">
            🎮 Jugador (Player)
          </span>
        </div>
      </div>

      {/* Shared Counter Display */}
      <div className="text-center py-8 bg-[#0d061f] rounded-2xl border-2 border-[#2c145a] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)]">
        <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider">
          Estado de la Ronda
        </span>
        <div className="text-7xl font-black text-white my-3 drop-shadow-[0_4px_0_#4c1d95]">
          {state.count}
        </div>
        <p className="text-xs font-bold text-purple-300/80 px-4">
          {state.phase === "lobby" && "Esperando que el anfitrión inicie el juego..."}
          {state.phase === "in-round" && "¡Juego en progreso! Usa los botones para cambiar el contador."}
          {state.phase === "results" && "¡Ronda finalizada!"}
        </p>
      </div>

      {/* Action Buttons */}
      {state.phase === "in-round" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => dispatch({ type: "DECREMENT", playerId })}
            className="py-5 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-3xl rounded-2xl border-2 border-rose-300/40 shadow-[0_6px_0_#9f1239] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            - 1
          </button>
          <button
            onClick={() => dispatch({ type: "INCREMENT", playerId })}
            className="py-5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-3xl rounded-2xl border-2 border-emerald-300/40 shadow-[0_6px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            + 1
          </button>
        </div>
      )}
    </div>
  );
}
