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
            ANFITRIÓN (HOST)
          </span>
        </div>
      </div>

      {/* Shared Counter Display */}
      <div className="text-center py-8 bg-[#0a0318] rounded-2xl border-3 border-[#281057] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)] space-y-2">
        <span className="text-xs font-black uppercase text-purple-300 tracking-widest">
          CONTADOR EN TIEMPO REAL
        </span>
        <div className="text-8xl font-black text-white drop-shadow-[4px_4px_0px_#8b5cf6]">
          {state.count}
        </div>
        <div className="inline-block px-4 py-1.5 bg-[#281057] text-xs font-black uppercase tracking-widest text-[#ff8c00] rounded-xl border border-purple-400/30">
          FASE: <strong className="text-white">{state.phase}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xl tracking-wider uppercase rounded-2xl border-4 border-[#047857] shadow-[0_8px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          COMENZAR RONDA / START
        </button>
      )}

      {state.phase === "in-round" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => dispatch({ type: "DECREMENT" })}
              className="py-5 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-3xl rounded-2xl border-4 border-[#9f1239] shadow-[0_8px_0_#9f1239] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
            >
              - 1
            </button>
            <button
              onClick={() => dispatch({ type: "INCREMENT" })}
              className="py-5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-3xl rounded-2xl border-4 border-[#047857] shadow-[0_8px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
            >
              + 1
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black text-lg tracking-wider uppercase rounded-2xl border-4 border-[#5b21b6] shadow-[0_8px_0_#5b21b6] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            FINALIZAR RONDA / FINISH
          </button>
        </div>
      )}

      {state.phase === "results" && (
        <button
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="w-full py-5 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-xl tracking-wider uppercase rounded-2xl border-4 border-[#9a3412] shadow-[0_8px_0_#9a3412] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          REINICIAR SALA / RESET
        </button>
      )}

      {/* Players List */}
      <div className="border-t-3 border-[#281057] pt-4">
        <h4 className="text-xs font-black uppercase text-purple-300 mb-2 tracking-widest">
          JUGADORES CONECTADOS ({players.length})
        </h4>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs font-black py-2.5 px-4 bg-[#0a0318] rounded-xl border-2 border-[#281057]"
            >
              <span className="tracking-wider">{p.displayName.toUpperCase()} {p.isHost ? "(HOST)" : ""}</span>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${p.isOnline ? "bg-[#10b981]/20 border-[#10b981] text-[#10b981]" : "bg-rose-950/80 border-rose-500 text-rose-300"}`}>
                {p.isOnline ? "EN LÍNEA" : "DESCONECTADO"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
