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
      setError("Código inválido. Usa 4 letras (ej. ABCD).");
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
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-[#180c35] text-white rounded-3xl border-2 border-[#3c1e78] shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/80 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Plataforma NexPlay v1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_3px_0_#4c1d95]">
          Nex<span className="text-amber-400">Play</span>
        </h1>
        <p className="text-xs font-medium text-purple-300/80">
          Juegos de mesa digitales para jugar en familia y amigos
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-[#0d061f] p-1.5 rounded-2xl border-2 border-[#2c145a]">
        <button
          onClick={() => {
            setMode("multi-device");
            setError(null);
          }}
          className={`py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
            mode === "multi-device"
              ? "bg-[#7c3aed] text-white shadow-[0_4px_0_#4c1d95]"
              : "text-purple-400 hover:text-white"
          }`}
        >
          📱 Multidispositivo
        </button>
        <button
          onClick={() => {
            setMode("single-device");
            setError(null);
          }}
          className={`py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all ${
            mode === "single-device"
              ? "bg-[#ff8c00] text-white shadow-[0_4px_0_#c2410c]"
              : "text-purple-400 hover:text-white"
          }`}
        >
          📲 1 Teléfono
        </button>
      </div>

      {/* Nickname Input */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex justify-between">
          <span>Tu Nombre / Nickname</span>
          <span className="text-[10px] text-purple-400 font-normal">Opcional</span>
        </label>
        <input
          type="text"
          maxLength={15}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ej. Mateo, Sofía, Papá"
          className="w-full px-4 py-3.5 bg-[#0d061f] border-2 border-[#3c1e78] rounded-2xl text-white placeholder-purple-600/70 font-semibold focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-purple-500/40 shadow-[inner_0_2px_4px_rgba(0,0,0,0.4)] transition-all"
        />
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/80 border-2 border-rose-500/50 rounded-2xl text-xs font-bold text-rose-200 text-center animate-bounce">
          ⚠️ {error}
        </div>
      )}

      {mode === "multi-device" ? (
        <div className="space-y-5 pt-1">
          {/* Create Room Button */}
          <button
            onClick={handleCreate}
            className="w-full py-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black text-base rounded-2xl border-2 border-[#a78bfa]/40 shadow-[0_6px_0_#4c1d95] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🏠</span> Crear Nueva Sala / Create Room
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-2 border-[#2c145a]"></div>
            <span className="flex-shrink mx-3 text-[11px] font-black uppercase text-purple-400 tracking-wider">
              o ingresar con código
            </span>
            <div className="flex-grow border-t-2 border-[#2c145a]"></div>
          </div>

          {/* Join Room Form */}
          <div className="grid grid-cols-5 gap-2">
            <input
              type="text"
              maxLength={4}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="col-span-3 px-3 py-3.5 bg-[#0d061f] border-2 border-[#3c1e78] rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-amber-400 placeholder-purple-800 uppercase focus:outline-none focus:border-amber-400 shadow-[inner_0_2px_4px_rgba(0,0,0,0.4)]"
            />
            <button
              onClick={handleJoin}
              className="col-span-2 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-black text-sm rounded-2xl border-2 border-emerald-300/40 shadow-[0_6px_0_#047857] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
            >
              🚀 Unirse
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <button
            onClick={handleSingleDevice}
            className="w-full py-4 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-base rounded-2xl border-2 border-amber-300/40 shadow-[0_6px_0_#c2410c] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🎮</span> Iniciar Modo 1 Teléfono (Pass & Play)
          </button>
        </div>
      )}
    </div>
  );
}
