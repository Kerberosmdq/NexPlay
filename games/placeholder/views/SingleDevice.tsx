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
  const totalPlayers = 3; // Default 3 players in pass & play demo

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 text-white rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">Modo de Juego</span>
          <h3 className="text-xl font-bold text-amber-400">📱 1 Teléfono (Pass & Play)</h3>
        </div>
        {onExit && (
          <button
            onClick={onExit}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg"
          >
            Salir / Exit
          </button>
        )}
      </div>

      <div className="text-center py-6 bg-slate-950/60 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">
          Pasa el teléfono a: Jugador {currentPlayerIndex + 1}
        </span>
        <div className="text-6xl font-black text-white my-3">{state.count}</div>
        <p className="text-xs text-slate-400">
          Modo compartido local — 1 solo teléfono
        </p>
      </div>

      {state.phase === "lobby" && (
        <button
          onClick={() => dispatch({ type: "START_GAME" })}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white shadow-lg"
        >
          🚀 Comenzar Juego Local / Start
        </button>
      )}

      {state.phase === "in-round" && (
        <div className="space-y-4">
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
            onClick={() => setCurrentPlayerIndex((prev) => (prev + 1) % totalPlayers)}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-white"
          >
            🔄 Pasar Teléfono ➔ Jugador {((currentPlayerIndex + 1) % totalPlayers) + 1}
          </button>

          <button
            onClick={() => dispatch({ type: "FINISH_GAME" })}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-medium text-sm rounded-xl text-slate-300"
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
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white"
        >
          🔄 Jugar de nuevo / Play Again
        </button>
      )}
    </div>
  );
}
