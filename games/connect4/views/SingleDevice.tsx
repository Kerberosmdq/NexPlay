"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { Connect4State, Connect4Action, Connect4Side } from "../reducer";
import { Board } from "./Board";
import { Button, Card } from "@/components/ui";

export interface Connect4SingleDeviceProps {
  state: Connect4State;
  dispatch: (action: Connect4Action) => void;
  onExit?: () => void;
}

function makeLocalPlayers(names: string[]): Player[] {
  const now = Date.now();
  return names.map((displayName, i) => ({
    id: `local-${i}-${displayName}`,
    displayName,
    isHost: i === 0,
    joinedAt: now + i,
    isOnline: true,
  }));
}

export function SingleDeviceView({ state, dispatch, onExit }: Connect4SingleDeviceProps) {
  const t = useTranslations("Connect4");

  // No realtime room roster exists in single-device mode, so names are
  // collected locally before the match starts — same pattern Who Am I's
  // single-device view already uses. `localPlayers` is fixed once the
  // match starts and is what resolves `state.sides`' ids back to display
  // names for the rest of this view (never re-derived from the id string
  // itself, which would break on a name containing a dash).
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);

  if (state.phase === "config") {
    const validNames = names.map((n) => n.trim());
    const canStart = validNames[0].length > 0 && validNames[1].length > 0;

    return (
      <Card className="flex flex-col items-center justify-center space-y-6 w-full max-w-md mx-auto">
        <h2 className="font-display text-3xl text-ink text-center">{t("title")}</h2>

        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              onChange={(e) => {
                const next: [string, string] = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              placeholder={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
              className="w-full bg-surface-sunken border-2 border-line text-ink p-3 rounded-xl font-semibold outline-none focus-visible:border-focus"
            />
          ))}
        </div>

        <Button
          variant="primary"
          disabled={!canStart}
          onClick={() => {
            const players = makeLocalPlayers(validNames);
            setLocalPlayers(players);
            dispatch({ type: "START_MATCH", playerIds: [players[0].id, players[1].id] });
          }}
          className="text-xl py-5"
        >
          {t("singleDevice.startButton")}
        </Button>

        {onExit && (
          <button onClick={onExit} className="text-xs text-ink-muted underline">
            {t("singleDevice.exitButton")}
          </button>
        )}
      </Card>
    );
  }

  const nameOf = (id: string): string => localPlayers.find((p) => p.id === id)?.displayName ?? id;
  const turnName = nameOf(state.sides[state.turn]);

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-4xl text-ink text-center leading-tight motion-celebrate">
          {state.isDraw ? t("draw") : t("singleDevice.wins", { name: nameOf(state.sides[state.winnerSide as Connect4Side]) })}
        </h2>

        <Board
          cells={state.cells}
          turnSide={state.turn}
          winningLine={state.winningLine}
          resolved
          disabled
          onColumnClick={() => {}}
        />

        <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="mt-4 max-w-xs">
          {t("playAgainButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
      <h2 className="font-display text-2xl text-ink text-center">{t("title")}</h2>

      <p className="text-sm font-bold text-center text-action-primary">
        {t("singleDevice.passPhoneTo", { name: turnName })}
      </p>

      <Board
        cells={state.cells}
        turnSide={state.turn}
        winningLine={null}
        resolved={false}
        disabled={false}
        onColumnClick={(column) => dispatch({ type: "DROP_DISC", column, side: state.turn })}
      />
    </div>
  );
}
