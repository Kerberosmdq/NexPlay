"use client";

import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { Connect4State, Connect4Action, Connect4Side } from "../reducer";
import { Board } from "./Board";
import { Button, WaitingState } from "@/components/ui";

interface PlayerProps {
  state: Connect4State;
  players: Player[];
  playerId?: string;
  dispatch: (action: Connect4Action) => void;
}

function nameFor(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.displayName ?? id;
}

export function PlayerView({ state, players, playerId, dispatch }: PlayerProps) {
  const t = useTranslations("Connect4");

  const me = players.find((p) => p.id === playerId) ?? players.find((p) => p.isHost);
  const isHost = me?.isHost || false;

  const mySide: Connect4Side | undefined =
    state.sides.A === playerId ? "A" : state.sides.B === playerId ? "B" : undefined;

  // Multi-device always starts with both real players already known, so
  // this shouldn't normally happen — a plain waiting message rather than
  // crashing on an unset side is just a safety net (same "don't assume a
  // full roster" caution `useRoomConnection`'s own comments already flag).
  if (state.phase === "config") {
    return <WaitingState label={t("waitingForOpponent")} />;
  }

  if (state.phase === "resolution") {
    const won = mySide !== undefined && state.winnerSide === mySide;

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2
          className={`font-display text-4xl text-center leading-tight motion-celebrate ${
            state.isDraw ? "text-ink" : won ? "text-action-primary" : "text-ink"
          }`}
        >
          {state.isDraw ? t("draw") : won ? t("youWon") : t("youLost")}
        </h2>

        <Board
          cells={state.cells}
          turnSide={state.turn}
          winningLine={state.winningLine}
          resolved
          disabled
          onColumnClick={() => {}}
        />

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="mt-4 max-w-xs">
            {t("playAgainButton")}
          </Button>
        )}
      </div>
    );
  }

  const isMyTurn = mySide === state.turn;
  const opponentSide: Connect4Side = mySide === "A" ? "B" : "A";
  const opponentName = state.sides[opponentSide] ? nameFor(players, state.sides[opponentSide]) : "";

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
      <h2 className="font-display text-2xl text-ink text-center">{t("title")}</h2>

      <p className={`text-sm font-bold text-center ${isMyTurn ? "text-action-primary" : "text-ink-muted"}`}>
        {isMyTurn ? t("yourTurn") : t("opponentTurn", { name: opponentName })}
      </p>

      <Board
        cells={state.cells}
        turnSide={state.turn}
        winningLine={null}
        resolved={false}
        disabled={!isMyTurn}
        onColumnClick={(column) => mySide && dispatch({ type: "DROP_DISC", column, side: mySide })}
      />
    </div>
  );
}
