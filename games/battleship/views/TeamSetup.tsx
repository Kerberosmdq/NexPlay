"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { BattleshipAction, BattleshipState } from "../reducer";
import { Button } from "@/components/ui";

/** M4c: a 4-player match starts here, splitting the room into two sides of
 * two. Only the host assigns; everyone watches the sides fill. */
export function TeamSetup({
  state,
  players,
  isHost,
  dispatch,
}: {
  state: BattleshipState;
  players: Player[];
  isHost: boolean;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");
  const nameFor = (id: string) => players.find((p) => p.id === id)?.displayName ?? id;
  const bothFull = state.sides.A.length === 2 && state.sides.B.length === 2;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <h2 className="font-display text-3xl text-ink text-center">{t("teamSetup.title")}</h2>
      {!isHost && <p className="text-base text-ink-muted text-center">{t("teamSetup.waitingForHost")}</p>}

      <div className="flex gap-3 w-full">
        {(["A", "B"] as const).map((side) => (
          <div key={side} className="flex-1 bg-surface-sunken rounded-2xl px-3 py-3 text-center space-y-1">
            <p className="font-display text-lg text-ink">{t(side === "A" ? "teamSetup.sideA" : "teamSetup.sideB")}</p>
            {state.sides[side].map((id) => (
              <p key={id} className="font-bold text-ink">
                {nameFor(id)}
              </p>
            ))}
          </div>
        ))}
      </div>

      {isHost && (
        <div className="w-full space-y-3">
          <p className="text-base font-bold text-ink-muted">{t("teamSetup.assignPlayersLabel")}</p>
          {state.rosterPlayerIds.map((id) => {
            const currentSide = state.sides.A.includes(id) ? "A" : state.sides.B.includes(id) ? "B" : null;
            return (
              <div key={id} className="flex items-center justify-between gap-2 bg-surface-sunken rounded-2xl px-3 py-2">
                <span className="font-bold text-ink text-lg min-w-0 truncate">{nameFor(id)}</span>
                <div className="flex gap-2 shrink-0">
                  {(["A", "B"] as const).map((side) => (
                    <Button
                      key={side}
                      variant="secondary"
                      fullWidth={false}
                      active={currentSide === side}
                      disabled={currentSide !== side && state.sides[side].length >= 2}
                      onClick={() => dispatch({ type: "ASSIGN_SIDE", playerId: id, side })}
                      className="px-4 text-base !mb-0"
                    >
                      {t(side === "A" ? "teamSetup.sideA" : "teamSetup.sideB")}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isHost && (
        <Button variant="primary" disabled={!bothFull} onClick={() => dispatch({ type: "START_TEAMS" })}>
          {t("teamSetup.startButton")}
        </Button>
      )}
    </div>
  );
}
