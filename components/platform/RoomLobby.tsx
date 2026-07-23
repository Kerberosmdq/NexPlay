"use client";

import { useState } from "react";
import { generateRoomCode, isValidRoomCode } from "@/lib/realtime";

export interface RoomLobbyProps {
  onStartSingleDevice: (displayName: string) => void;
  onCreateRoom: (displayName: string, code: string) => void;
  onJoinRoom: (displayName: string, code: string) => void;
}

export function RoomLobby({
  onStartSingleDevice,
  onCreateRoom,
  onJoinRoom,
}: RoomLobbyProps) {
  const [mode, setMode] = useState<"multi-device" | "single-device">("multi-device");
  const [displayName, setDisplayName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const name = displayName.trim() || "Anfitrión";
    const code = generateRoomCode();
    setError(null);
    onCreateRoom(name, code);
  };

  const handleJoin = () => {
    const name = displayName.trim() || "Jugador";
    const code = joinCodeInput.trim().toUpperCase();

    if (!isValidRoomCode(code)) {
      setError("Código de sala inválido. Debe ser de 4 letras (ej. ABCD).");
      return;
    }

    setError(null);
    onJoinRoom(name, code);
  };

  const handleSingleDevice = () => {
    const name = displayName.trim() || "Jugador 1";
    setError(null);
    onStartSingleDevice(name);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 text-white rounded-3xl shadow-2xl space-y-6 border border-slate-800">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          NexPlay
        </h1>
        <p className="text-xs text-slate-400">
          Juegos de mesa digitales para jugar en familia y amigos
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-sm">
        <button
          onClick={() => {
            setMode("multi-device");
            setError(null);
          }}
          className={`py-2.5 rounded-xl font-bold transition-all ${
            mode === "multi-device"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📱 Cada teléfono
        </button>
        <button
          onClick={() => {
            setMode("single-device");
            setError(null);
          }}
          className={`py-2.5 rounded-xl font-bold transition-all ${
            mode === "single-device"
              ? "bg-amber-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📲 1 Teléfono
        </button>
      </div>

      {/* Display Name Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tu Nombre / Nickname
        </label>
        <input
          type="text"
          maxLength={15}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ej. Mateo, Sofía, Papá"
          className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {mode === "multi-device" ? (
        <div className="space-y-4 pt-2">
          {/* Create Room Button */}
          <button
            onClick={handleCreate}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 font-extrabold rounded-xl text-white shadow-lg active:scale-95 transition-transform"
          >
            🏠 Crear Nueva Sala / Create Room
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase">o únete con código</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Join Room Input & Button */}
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="w-1/2 px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-mono font-bold tracking-widest text-indigo-400 placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleJoin}
              className="w-1/2 py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white active:scale-95 transition-transform"
            >
              🚀 Unirse / Join
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <button
            onClick={handleSingleDevice}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 font-extrabold rounded-xl text-white shadow-lg active:scale-95 transition-transform"
          >
            🎮 Iniciar Modo 1 Teléfono (Pass & Play)
          </button>
        </div>
      )}
    </div>
  );
}
