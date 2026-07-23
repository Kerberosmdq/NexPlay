"use client";

import { useState } from "react";
import type { PlaceholderState, PlaceholderAction } from "../reducer";

export interface SingleDeviceViewProps {
  state: PlaceholderState;
  dispatch: (action: PlaceholderAction) => void;
  onExit?: () => void;
}

export function SingleDeviceView({ state, dispatch, onExit }: SingleDeviceViewProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const totalPlayers = 3;

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#180c35] text-white rounded-3xl border-2 border-[#3c1e78] shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#2c145a] pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Modo de Juego</span>
          <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
            <span>📲</span> 1 Teléfono (Pass & Play)
          </h3>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="text-xs bg-[#2c145a] hover:bg-[#3c1e78] font-bold text-purple-200 px-3 py-1.5 rounded-xl border border-purple-500/30"
          >
            Salir
          </button>
        )}
      </div>

      {/* Turn Display */}
      <div className="text-center py-6 bg-[#0d061f] rounded-2xl border-2 border-[#2c145a] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)]">
        <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
          Turno Actual: Jugador {currentPlayerIndex + 1}
        </span>
        <div className="text-7xl font-black text-white my-3 drop-shadow-[0_4px_0_#4c1d95]">
          {state.count}
        </div>
        <p className="text-[11px] font-semibold text-purple-300/70">
          Un solo dispositivo compartido entre {totalPlayers} jugadores
        </p>
      </div>

      {/* Action Buttons */}
      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white font-black text-base rounded-2xl border-2 border-emerald-300/40 shadow-[0_6px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          🚀 Comenzar Juego Local / Start
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
            onClick={() => setCurrentPlayerIndex((prev) => (prev + 1) % totalPlayers)}
            className="w-full py-3.5 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-sm rounded-2xl border-2 border-amber-300/40 shadow-[0_6px_0_#c2410c] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            🔄 Pasar Teléfono ➔ Jugador {((currentPlayerIndex + 1) % totalPlayers) + 1}
          </button>

          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-3 bg-[#2c145a] hover:bg-[#3c1e78] font-bold text-xs rounded-2xl text-purple-200 border border-purple-500/30"
          >
            🏁 Finalizar Ronda / Finish
          </button>
        </div>
      )}

      {state.phase === "results" && (
        <button
          onClick={() => {
            dispatch({ type: "RESET_GAME" });
            setCurrentPlayerIndex(0);
          }}
          className="w-full py-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-base rounded-2xl border-2 border-purple-300/40 shadow-[0_6px_0_#4c1d95] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          🔄 Jugar de nuevo / Play Again
        </button>
      )}
    </div>
  );
}
