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
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative Floating Party Icons/Shapes around card */}
      <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-tr from-cyan-400 to-emerald-400 rounded-2xl rotate-12 shadow-[0_0_20px_rgba(6,182,212,0.6)] hidden sm:block pointer-events-none z-10 border-2 border-white/40"></div>
      <div className="absolute -bottom-6 -right-6 w-14 h-14 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-2xl -rotate-12 shadow-[0_0_20px_rgba(255,140,0,0.6)] hidden sm:block pointer-events-none z-10 border-2 border-white/40"></div>

      {/* Main Lobby Card with Party Background */}
      <div 
        className="relative w-full overflow-hidden p-6 sm:p-8 text-white rounded-3xl border-4 border-[#3b177d] shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-6"
        style={{
          backgroundColor: '#13072b',
          backgroundImage: `
            radial-gradient(circle at 10% 15%, rgba(139, 92, 246, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 90% 85%, rgba(255, 140, 0, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill-opacity='0.85'%3E%3Cpath fill='%23ff8c00' d='M15 15l8 16L7 22zM120 30l12 6-6 14zM65 90l10-10 10 10-10 10zM140 130l8 14-14-6z'/%3E%3Ccircle fill='%2310b981' cx='40' cy='120' r='7'/%3E%3Ccircle fill='%2306b6d4' cx='130' cy='70' r='6'/%3E%3Ccircle fill='%23f43f5e' cx='90' cy='25' r='5'/%3E%3Cpath fill='%2306b6d4' d='M90 20h16v5H90zM25 65h6v16h-6z'/%3E%3Cpath fill='%23ec4899' d='M110 115l8-14 8 14zM30 35l14 8-12 10z'/%3E%3Cpath fill='%23a78bfa' d='M50 140h14v5H50zM130 15h5v14h-5z'/%3E%3C/g%3E%3C/svg%3E")
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 160px 160px'
        }}
      >
        {/* Brand Header */}
        <div className="text-center space-y-1 pb-4">
          <h1 
            className="text-6xl sm:text-7xl font-black tracking-tighter select-none -rotate-2"
            style={{
              WebkitTextStroke: '2px #13072b',
              textShadow: `
                0px 1px 0 #13072b,
                0px 2px 0 #13072b,
                0px 3px 0 #13072b,
                3px 4px 0 #ff8c00,
                3px 5px 0 #ff8c00,
                3px 6px 0 #ff8c00,
                3px 7px 0 #ff8c00,
                4px 8px 0 #13072b
              `
            }}
          >
            <span className="text-[#a855f7]">Nex</span><span className="text-[#facc15]">Play</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-[#10b981] uppercase pt-3">
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
                          ? "border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.7)] scale-105"
                          : isFocused
                          ? "border-[#ff8c00] shadow-[0_0_20px_rgba(255,140,0,0.7)] animate-pulse"
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
    </div>
  );
}
