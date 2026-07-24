"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import { AVAILABLE_GAMES } from "@/lib/realtime/platformReducer";

interface RoomWaitingLobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartGame: (gameId: string) => void;
}

export function RoomWaitingLobby({ roomCode, players, isHost, onStartGame }: RoomWaitingLobbyProps) {
  const t = useTranslations("Lobby");
  // meta.name is an i18n key (ADR-0002 §3); a game's description follows the
  // sibling convention `games.<id>.description` in the same catalog.
  const tGame = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-4xl px-4">
      {/* ROOM CODE HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-xl text-purple-300 font-bold tracking-widest uppercase">{t("roomCodeLabel")}</h2>
        <div className="text-7xl font-black text-white tracking-widest bg-white/10 px-12 py-4 rounded-3xl border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          {roomCode}
        </div>
        <p className="text-sm text-white/50 pt-2">{t("shareHint")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* PLAYERS LIST */}
        <div className="bg-[#13072b]/80 border-2 border-[#3b177d] rounded-3xl p-6 space-y-4">
          <h3 className="text-2xl font-bold text-white flex items-center justify-between">
            {t("playersLabel")}
            <span className="text-pink-500 bg-pink-500/20 px-3 py-1 rounded-full text-sm">
              {players.length}
            </span>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${p.isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500"}`} />
                <span className="text-lg text-white font-semibold flex-1">{p.displayName}</span>
                {p.isHost && <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-bold">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        {/* GAME SELECTION */}
        <div className="bg-[#13072b]/80 border-2 border-[#3b177d] rounded-3xl p-6 space-y-4 flex flex-col">
          <h3 className="text-2xl font-bold text-white">{t("gamesLabel")}</h3>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {Object.values(AVAILABLE_GAMES).map((game) => (
              <div
                key={game.id}
                className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-pink-500/30 p-4 rounded-2xl flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-black text-white">{tGame(game.meta.name)}</h4>
                </div>
                <p className="text-sm text-purple-200 mb-4 flex-1">
                  {tGame(`games.${game.id}.description`)}
                </p>

                {isHost ? (
                  <button
                    onClick={() => onStartGame(game.id)}
                    className="w-full bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                  >
                    {t("playThisButton")}
                  </button>
                ) : (
                  <div className="w-full bg-black/20 text-white/50 text-center font-bold py-3 rounded-xl">
                    {t("hostOnlyHint")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
