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
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-[#13072b] text-white rounded-3xl border-4 border-[#3b177d] shadow-[0_16px_48px_rgba(0,0,0,0.8)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-3 border-[#281057] pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-purple-300">MODO DE JUEGO</span>
          <h3 className="text-xl font-black text-[#ff8c00] tracking-wider uppercase">
            1 TELÉFONO (PASS & PLAY)
          </h3>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="text-xs bg-[#281057] hover:bg-[#3b177d] font-black uppercase tracking-wider text-purple-200 px-4 py-2 rounded-xl border-2 border-purple-400/40"
          >
            SALIR
          </button>
        )}
      </div>

      {/* Turn Display */}
      <div className="text-center py-8 bg-[#0a0318] rounded-2xl border-3 border-[#281057] shadow-[inner_0_2px_6px_rgba(0,0,0,0.6)] space-y-2">
        <span className="text-xs font-black uppercase text-[#ff8c00] tracking-widest">
          TURNO ACTUAL: JUGADOR {currentPlayerIndex + 1}
        </span>
        <div className="text-8xl font-black text-white drop-shadow-[4px_4px_0px_#8b5cf6]">
          {state.count}
        </div>
        <p className="text-xs font-black uppercase text-purple-300 tracking-wider">
          UN SOLO DISPOSITIVO COMPARTIDO
        </p>
      </div>

      {/* Action Buttons */}
      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xl tracking-wider uppercase rounded-2xl border-4 border-[#047857] shadow-[0_8px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          COMENZAR JUEGO LOCAL / START
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
            onClick={() => setCurrentPlayerIndex((prev) => (prev + 1) % totalPlayers)}
            className="w-full py-4 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-lg tracking-wider uppercase rounded-2xl border-4 border-[#9a3412] shadow-[0_8px_0_#9a3412] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            PASAR TELÉFONO ➔ JUGADOR {((currentPlayerIndex + 1) % totalPlayers) + 1}
          </button>

          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-3.5 bg-[#281057] hover:bg-[#3b177d] font-black text-xs uppercase tracking-wider text-purple-200 rounded-2xl border-2 border-purple-400/30"
          >
            FINALIZAR RONDA / FINISH
          </button>
        </div>
      )}

      {state.phase === "results" && (
        <button
          onClick={() => {
            dispatch({ type: "RESET_GAME" });
            setCurrentPlayerIndex(0);
          }}
          className="w-full py-5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black text-xl tracking-wider uppercase rounded-2xl border-4 border-[#5b21b6] shadow-[0_8px_0_#5b21b6] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
        >
          JUGAR DE NUEVO / PLAY AGAIN
        </button>
      )}
    </div>
  );
}
