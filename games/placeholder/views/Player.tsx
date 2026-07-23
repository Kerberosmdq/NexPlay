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
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-[#13072b] text-white rounded-3xl border-4 border-[#3b177d] shadow-[0_16px_48px_rgba(0,0,0,0.8)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-3 border-[#281057] pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-purple-300">CÓDIGO DE SALA</span>
          <h2 className="text-4xl font-black tracking-widest text-[#ff8c00] drop-shadow-[2px_2px_0px_#7c3aed]">{roomCode}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-black uppercase tracking-widest text-purple-300">TU ROL</span>
          <span className="block text-xs font-black px-3 py-1.5 bg-[#8b5cf6] text-white rounded-xl border-2 border-purple-300/40 uppercase tracking-wider">
            JUGADOR (PLAYER)
          </span>
        </div>
      </div>

      {/* Shared Counter Display */}
      <div className="text-center py-8 bg-[#0a0318] rounded-2xl border-3 border-[#281057] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)] space-y-2">
        <span className="text-xs font-black uppercase text-purple-300 tracking-widest">
          ESTADO EN TIEMPO REAL
        </span>
        <div className="text-8xl font-black text-white drop-shadow-[4px_4px_0px_#8b5cf6]">
          {state.count}
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-[#ff8c00] px-4">
          {state.phase === "lobby" && "ESPERANDO AL ANFITRIÓN..."}
          {state.phase === "in-round" && "¡USA LOS BOTONES PARA CAMBIAR EL CONTADOR!"}
          {state.phase === "results" && "¡RONDA FINALIZADA!"}
        </p>
      </div>

      {/* Action Buttons */}
      {state.phase === "in-round" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => dispatch({ type: "DECREMENT", playerId })}
            className="py-6 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-4xl rounded-2xl border-4 border-[#9f1239] shadow-[0_8px_0_#9f1239] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            - 1
          </button>
          <button
            onClick={() => dispatch({ type: "INCREMENT", playerId })}
            className="py-6 bg-[#10b981] hover:bg-[#059669] text-white font-black text-4xl rounded-2xl border-4 border-[#047857] shadow-[0_8px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            + 1
          </button>
        </div>
      )}
    </div>
  );
}
