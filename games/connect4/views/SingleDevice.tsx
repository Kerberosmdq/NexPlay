"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/lib/types/room";
import type { Connect4State, Connect4Action, Connect4Side } from "../reducer";
import { Board } from "./Board";
import { Button } from "@/components/ui";
import { Disc, ResultBlock, TurnBanner } from "./parts";
import { loadFamilyRoster, prefillNames, rememberFamilyNames } from "@/lib/family/roster";

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

export function SingleDeviceView({ state, dispatch }: Connect4SingleDeviceProps) {
  const t = useTranslations("Connect4");

  // No realtime room roster exists in single-device mode, so names are
  // collected locally before the match starts — same pattern Who Am I's
  // single-device view already uses. `localPlayers` is fixed once the
  // match starts and is what resolves `state.sides`' ids back to display
  // names for the rest of this view (never re-derived from the id string
  // itself, which would break on a name containing a dash).
  const [names, setNames] = useState<[string, string]>(() => {
    const [first, second] = prefillNames(loadFamilyRoster(), 2, 2);
    return [first, second];
  });
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);

  if (state.phase === "config") {
    const validNames = names.map((n) => n.trim());
    const canStart = validNames[0].length > 0 && validNames[1].length > 0;

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <h2 className="font-display text-3xl text-ink text-center">{t("title")}</h2>

        {/* Each name sits next to the disc that player will drop, so it's
            settled who is red and who is yellow before the first move. */}
        <div className="w-full space-y-3">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0">
                <Disc side={i === 0 ? "A" : "B"} />
              </div>
              <input
                value={name}
                aria-label={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
                onChange={(e) => {
                  const next: [string, string] = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={t("singleDevice.playerNamePlaceholder", { n: i + 1 })}
                className="w-full min-w-0 bg-surface-sunken border-2 border-transparent text-ink text-xl px-5 py-3 rounded-2xl font-bold placeholder:text-ink-muted placeholder:font-semibold outline-none shadow-[inset_0_3px_0_var(--color-edge-sunken)] focus-visible:border-focus"
              />
            </div>
          ))}
        </div>

        <div className="w-full space-y-2">
          {!canStart && <p className="text-sm text-ink-muted text-center">{t("singleDevice.bothNamesHint")}</p>}
          <Button
            variant="primary"
            disabled={!canStart}
            onClick={() => {
              const players = makeLocalPlayers(validNames);
              rememberFamilyNames(validNames);
              setLocalPlayers(players);
              dispatch({ type: "START_MATCH", playerIds: [players[0].id, players[1].id] });
            }}
            className="text-2xl py-5"
          >
            {t("singleDevice.startButton")}
          </Button>
        </div>
      </div>
    );
  }

  // `localPlayers` is set when the match starts; if this view remounts mid-
  // match (a dev hot reload, for one) it comes back empty. The ids are
  // derived from the names deterministically, so rebuild them rather than
  // showing a raw id like "local-0-Ana" as a winner's name.
  const knownPlayers = localPlayers.length > 0 ? localPlayers : makeLocalPlayers(names.map((n) => n.trim()));
  const nameOf = (id: string): string => knownPlayers.find((p) => p.id === id)?.displayName ?? id;
  const turnName = nameOf(state.sides[state.turn]);

  if (state.phase === "resolution") {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <ResultBlock
          winnerSide={state.isDraw ? null : (state.winnerSide as Connect4Side)}
          title={
            state.isDraw
              ? t("draw")
              : t("singleDevice.wins", { name: nameOf(state.sides[state.winnerSide as Connect4Side]) })
          }
        />

        <Board
          cells={state.cells}
          turnSide={state.turn}
          winningLine={state.winningLine}
          resolved
          disabled
          onColumnClick={() => {}}
        />

        <Button variant="primary" onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
          {t("playAgainButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <h2 className="font-display text-3xl text-ink text-center">{t("title")}</h2>

      <TurnBanner side={state.turn}>{t("opponentTurn", { name: turnName })}</TurnBanner>

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
