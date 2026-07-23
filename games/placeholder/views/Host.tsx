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
    <div className="w-full max-w-md mx-auto p-6 bg-[#180c35] text-white rounded-3xl border-2 border-[#3c1e78] shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#2c145a] pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Código de Sala</span>
          <h2 className="text-3xl font-black tracking-widest text-amber-400 drop-shadow-[0_2px_0_#92400e]">{roomCode}</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tu Rol</span>
          <span className="block text-xs font-black px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-full">
            👑 Anfitrión (Host)
          </span>
        </div>
      </div>

      {/* Shared Counter Display */}
      <div className="text-center py-6 bg-[#0d061f] rounded-2xl border-2 border-[#2c145a] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)]">
        <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider">
          Contador Sincronizado
        </span>
        <div className="text-7xl font-black text-white my-3 drop-shadow-[0_4px_0_#4c1d95]">
          {state.count}
        </div>
        <div className="inline-block px-3 py-1 bg-purple-950/80 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300">
          Fase: <strong className="text-amber-400 capitalize">{state.phase}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black text-base rounded-2xl border-2 border-emerald-300/40 shadow-[0_6px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          🚀 Comenzar Ronda / Start Match
        </button>
      )}

      {state.phase === "in-round" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => dispatch({ type: "DECREMENT" })}
              className="py-4 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-2xl rounded-2xl border-2 border-rose-300/40 shadow-[0_6px_0_#9f1239] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
            >
              - 1
            </button>
            <button
              onClick={() => dispatch({ type: "INCREMENT" })}
              className="py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black text-2xl rounded-2xl border-2 border-emerald-300/40 shadow-[0_6px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
            >
              + 1
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-sm rounded-2xl border-2 border-purple-300/40 shadow-[0_6px_0_#4c1d95] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            🏁 Finalizar Ronda / Finish
          </button>
        </div>
      )}

      {state.phase === "results" && (
        <button
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="w-full py-4 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-base rounded-2xl border-2 border-amber-300/40 shadow-[0_6px_0_#c2410c] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          🔄 Reiniciar Sala / Reset
        </button>
      )}

      {/* Players List */}
      <div className="border-t-2 border-[#2c145a] pt-4">
        <h4 className="text-xs font-black uppercase text-purple-300 mb-2 tracking-wider">
          Jugadores Conectados ({players.length})
        </h4>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-xs py-2 px-3 bg-[#0d061f] rounded-xl border border-[#2c145a]"
            >
              <span className="font-bold">{p.displayName} {p.isHost ? "👑" : ""}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${p.isOnline ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300" : "bg-rose-950/80 border-rose-500/40 text-rose-300"}`}>
                {p.isOnline ? "En línea" : "Desconectado"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
