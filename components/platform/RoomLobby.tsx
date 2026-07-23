"use client";

import { useRef, useState } from "react";
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

  const hiddenInputRef = useRef<HTMLInputElement>(null);

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
      setError("INGRESA UN CÓDIGO DE 4 LETRAS (EJ. ABCD)");
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

  const codeChars = joinCodeInput.padEnd(4, "").split("");

  return (
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 bg-[#13072b]/95 backdrop-blur-md text-white rounded-3xl border-4 border-[#3b177d] shadow-[0_16px_48px_rgba(0,0,0,0.8)] space-y-6">
      {/* Brand Header - Clean & Crisp Logo without text shadow */}
      <div className="text-center space-y-1">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight select-none">
          <span className="text-[#8b5cf6]">Nex</span>
          <span className="text-[#ff8c00]">Play</span>
        </h1>
        <p className="text-xs sm:text-sm font-black tracking-widest text-[#ff8c00] uppercase pt-2">
          ¡ÚNETE AL JUEGO! / JOIN THE GAME!
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-3 bg-[#0a0318] p-2 rounded-2xl border-3 border-[#281057]">
        <button
          onClick={() => {
            setMode("multi-device");
            setError(null);
          }}
          className={`py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all ${
            mode === "multi-device"
              ? "bg-[#8b5cf6] text-white shadow-[0_4px_0_#5b21b6] border-2 border-purple-300/40"
              : "text-purple-300 hover:text-white"
          }`}
        >
          MULTIDISPOSITIVO
        </button>
        <button
          onClick={() => {
            setMode("single-device");
            setError(null);
          }}
          className={`py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all ${
            mode === "single-device"
              ? "bg-[#ff8c00] text-white shadow-[0_4px_0_#9a3412] border-2 border-amber-300/40"
              : "text-purple-300 hover:text-white"
          }`}
        >
          1 TELÉFONO
        </button>
      </div>

      {/* Nickname Input */}
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-purple-300">
          TU NOMBRE / NICKNAME
        </label>
        <input
          type="text"
          maxLength={15}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="EJ. MATEO, SOFÍA, PAPÁ"
          className="w-full px-5 py-4 bg-[#0a0318] border-3 border-[#3b177d] rounded-2xl text-white placeholder-purple-600 font-extrabold text-base focus:outline-none focus:border-[#ff8c00] shadow-[inner_0_2px_4px_rgba(0,0,0,0.6)] uppercase tracking-wider"
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-950/90 border-3 border-rose-500 rounded-2xl text-xs font-black text-rose-200 text-center tracking-wider">
          ⚠️ {error}
        </div>
      )}

      {mode === "multi-device" ? (
        <div className="space-y-6 pt-2">
          {/* Room Code Entry Label & Tiles */}
          <div className="space-y-3">
            <label className="block text-center text-xs font-black uppercase tracking-widest text-purple-300">
              CÓDIGO DE SALA / ENTER ROOM CODE
            </label>

            {/* Hidden Input */}
            <input
              ref={hiddenInputRef}
              type="text"
              maxLength={4}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="sr-only"
              autoCapitalize="characters"
            />

            {/* 4 Glowing Code Tiles */}
            <div
              onClick={() => hiddenInputRef.current?.focus()}
              className="flex justify-center gap-3 sm:gap-4 cursor-pointer select-none"
            >
              {[0, 1, 2, 3].map((idx) => {
                const char = codeChars[idx] || "";
                const isFocused = joinCodeInput.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center bg-[#05020c] border-4 transition-all ${
                      char
                        ? "border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105"
                        : isFocused
                        ? "border-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.5)] animate-pulse"
                        : "border-[#2d1259]"
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl font-black text-[#10b981] tracking-widest">
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Party Button */}
          <button
            onClick={handleJoin}
            className="w-full py-4 sm:py-5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black text-xl sm:text-2xl tracking-wider uppercase rounded-2xl border-4 border-[#ff8c00] shadow-[0_8px_0_#ff8c00] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            UNIRSE A SALA / JOIN PARTY
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-2 border-[#281057]"></div>
            <span className="flex-shrink mx-4 text-xs font-black uppercase text-purple-400 tracking-widest">
              O CREA UNA NUEVA
            </span>
            <div className="flex-grow border-t-2 border-[#281057]"></div>
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreate}
            className="w-full py-4 sm:py-5 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-xl sm:text-2xl tracking-wider uppercase rounded-2xl border-4 border-[#1e0b3d] shadow-[0_8px_0_#1e0b3d] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            CREAR NUEVA SALA / CREATE ROOM
          </button>
        </div>
      ) : (
        <div className="pt-4">
          <button
            onClick={handleSingleDevice}
            className="w-full py-5 bg-[#ff8c00] hover:bg-[#ea580c] text-white font-black text-xl sm:text-2xl tracking-wider uppercase rounded-2xl border-4 border-[#1e0b3d] shadow-[0_8px_0_#1e0b3d] hover:translate-y-[-2px] active:translate-y-[4px] active:shadow-none transition-all duration-100"
          >
            INICIAR MODO 1 TELÉFONO
          </button>
        </div>
      )}
    </div>
  );
}
