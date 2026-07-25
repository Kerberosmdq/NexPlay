"use client";

import { useState } from "react";
import { generateRoomCode, isValidRoomCode } from "@/lib/realtime";
import { Button, CodeInput, Field } from "@/components/ui";

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

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative floating shapes — part of the current Option C
          identity being replaced wholesale by BDR-0001 in M3.5 code task
          2; left as-is rather than tokenized since this exact treatment
          is slated for removal, not migration. */}
      <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-tr from-cyan-400 to-emerald-400 rounded-2xl rotate-12 shadow-[0_0_20px_rgba(6,182,212,0.6)] hidden sm:block pointer-events-none z-10 border-2 border-white/40"></div>
      <div className="absolute -bottom-6 -right-6 w-14 h-14 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-2xl -rotate-12 shadow-[0_0_20px_rgba(255,140,0,0.6)] hidden sm:block pointer-events-none z-10 border-2 border-white/40"></div>

      {/* Main Lobby Card — background art is the same "slated for
          replacement, not migration" exception as the shapes above; the
          card's base surface now reads from the token instead of a raw
          hex literal. */}
      <div
        className="relative w-full overflow-hidden p-6 sm:p-8 text-ink rounded-3xl border-4 border-line shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-6"
        style={{
          backgroundColor: "var(--color-surface-raised)",
          backgroundImage: `
            radial-gradient(circle at 10% 15%, rgba(139, 92, 246, 0.4) 0%, transparent 45%),
            radial-gradient(circle at 90% 85%, rgba(255, 140, 0, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill-opacity='0.85'%3E%3Cpath fill='%23ff8c00' d='M15 15l8 16L7 22zM120 30l12 6-6 14zM65 90l10-10 10 10-10 10zM140 130l8 14-14-6z'/%3E%3Ccircle fill='%2310b981' cx='40' cy='120' r='7'/%3E%3Ccircle fill='%2306b6d4' cx='130' cy='70' r='6'/%3E%3Ccircle fill='%23f43f5e' cx='90' cy='25' r='5'/%3E%3Cpath fill='%2306b6d4' d='M90 20h16v5H90zM25 65h6v16h-6z'/%3E%3Cpath fill='%23ec4899' d='M110 115l8-14 8 14zM30 35l14 8-12 10z'/%3E%3Cpath fill='%23a78bfa' d='M50 140h14v5H50zM130 15h5v14h-5z'/%3E%3C/g%3E%3C/svg%3E")
          `,
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 160px 160px",
        }}
      >
        {/* Brand Header — the Option C wordmark, same replacement note as
            above; the real Nex hexagon identity lands in code task 3. */}
        <div className="text-center space-y-1 pb-4">
          <h1
            className="text-6xl sm:text-7xl font-black tracking-tighter select-none -rotate-2"
            style={{
              WebkitTextStroke: "2px var(--color-surface-raised)",
              textShadow: `
                0px 1px 0 var(--color-surface-raised),
                0px 2px 0 var(--color-surface-raised),
                0px 3px 0 var(--color-surface-raised),
                3px 4px 0 var(--color-action-secondary),
                3px 5px 0 var(--color-action-secondary),
                3px 6px 0 var(--color-action-secondary),
                3px 7px 0 var(--color-action-secondary),
                4px 8px 0 var(--color-surface-raised)
              `,
            }}
          >
            <span className="text-[#a855f7]">Nex</span><span className="text-[#facc15]">Play</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-accent-mint uppercase pt-3">
            ¡ÚNETE AL JUEGO! / JOIN THE GAME!
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 bg-surface-sunken p-2 rounded-2xl border-3 border-line">
          <Button
            variant="primary"
            active={mode === "multi-device"}
            onClick={() => {
              setMode("multi-device");
              setError(null);
            }}
            className="text-xs sm:text-sm tracking-wider uppercase"
          >
            MULTIDISPOSITIVO
          </Button>
          <Button
            variant="secondary"
            active={mode === "single-device"}
            onClick={() => {
              setMode("single-device");
              setError(null);
            }}
            className="text-xs sm:text-sm tracking-wider uppercase"
          >
            1 TELÉFONO
          </Button>
        </div>

        <Field
          label="TU NOMBRE / NICKNAME"
          maxLength={15}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="EJ. MATEO, SOFÍA, PAPÁ"
          className="uppercase tracking-wider"
        />

        {error && (
          <div className="p-4 bg-rose-950/90 border-3 border-rose-500 rounded-2xl text-xs font-black text-rose-200 text-center tracking-wider">
            ⚠️ {error}
          </div>
        )}

        {mode === "multi-device" ? (
          <div className="space-y-6 pt-2">
            <CodeInput
              label="CÓDIGO DE SALA / ENTER ROOM CODE"
              value={joinCodeInput}
              onChange={setJoinCodeInput}
            />

            <Button variant="primary" onClick={handleJoin} className="text-xl sm:text-2xl uppercase tracking-wider">
              UNIRSE A SALA / JOIN PARTY
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t-2 border-line"></div>
              <span className="flex-shrink mx-4 text-xs font-black uppercase text-ink-muted tracking-widest">
                O CREA UNA NUEVA
              </span>
              <div className="flex-grow border-t-2 border-line"></div>
            </div>

            <Button variant="secondary" onClick={handleCreate} className="text-xl sm:text-2xl uppercase tracking-wider">
              CREAR NUEVA SALA / CREATE ROOM
            </Button>
          </div>
        ) : (
          <div className="pt-4">
            <Button variant="secondary" onClick={handleSingleDevice} className="text-xl sm:text-2xl uppercase tracking-wider">
              INICIAR MODO 1 TELÉFONO
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
