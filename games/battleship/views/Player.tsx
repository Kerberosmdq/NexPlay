"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Player, PrivateStateUpdater } from "@/lib/types/room";
import { otherSide, type BattleshipState, type BattleshipAction, type BattleshipPrivate, type BattleshipSide } from "../reducer";
import { shipCells, canPlaceShip, isFleetComplete, randomFleetPlacement, type ShipPlacement, type Orientation } from "../placement";
import { Button, Card, WaitingState } from "@/components/ui";

interface PlayerProps {
  state: BattleshipState;
  players: Player[];
  // Optional because this component also fills the `host` view slot, whose
  // contract doesn't guarantee a playerId — same fallback pattern as
  // Impostor's PlayerView.
  playerId?: string;
  roomCode: string;
  dispatch: (action: BattleshipAction) => void;
  privateState?: BattleshipPrivate;
  setPrivateState?: PrivateStateUpdater<BattleshipPrivate>;
}

function columnLabel(col: number): string {
  return String.fromCharCode(65 + col);
}

function shipTypeAt(fleet: ShipPlacement[], cell: string): string | null {
  return fleet.find((s) => s.cells.includes(cell))?.type ?? null;
}

function BoardGrid({
  boardSize,
  cellClassName,
  onCellClick,
}: {
  boardSize: number;
  cellClassName: (row: number, col: number, cell: string) => string;
  onCellClick?: (row: number, col: number, cell: string) => void;
}) {
  return (
    <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}>
      {Array.from({ length: boardSize }).flatMap((_, row) =>
        Array.from({ length: boardSize }).map((_, col) => {
          const cell = `${row}-${col}`;
          const className = `aspect-square rounded-md ${cellClassName(row, col, cell)}`;
          if (!onCellClick) {
            return <div key={cell} className={className} aria-hidden="true" />;
          }
          return (
            <button
              key={cell}
              type="button"
              aria-label={`${columnLabel(col)}${row + 1}`}
              onClick={() => onCellClick(row, col, cell)}
              className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
            />
          );
        })
      )}
    </div>
  );
}

export function PlayerView({
  state,
  players,
  playerId: rawPlayerId,
  dispatch,
  privateState,
  setPrivateState,
}: PlayerProps) {
  const t = useTranslations("Battleship");
  const tShips = useTranslations("Battleship.ships");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");

  const me = players.find((p) => p.id === rawPlayerId) ?? players.find((p) => p.isHost);
  const playerId = rawPlayerId ?? me?.id ?? "";
  const isHost = me?.isHost || false;

  const mySide: BattleshipSide | null = state.sides.A.includes(playerId)
    ? "A"
    : state.sides.B.includes(playerId)
      ? "B"
      : null;
  const opponentSide = mySide ? otherSide(mySide) : null;
  const fleet = privateState?.fleet ?? [];
  const loserSide = state.winner ? otherSide(state.winner) : null;

  // ADR-0005: once the match resolves, the losing side's own device reveals
  // its board — it's no longer secret at that point. Every hook must run
  // unconditionally before any phase-based early return below.
  useEffect(() => {
    if (state.phase !== "resolution" || !mySide || !setPrivateState) return;
    if (loserSide !== mySide || state.revealedFleets[mySide]) return;
    dispatch({ type: "REVEAL_FLEET", side: mySide, fleet });
    // `fleet`/`dispatch` are stable enough in practice (new closures each
    // render, but the guards above make this effect a no-op once it has
    // fired) — depending on the full array here would refire on every
    // unrelated private-state change without ever changing the outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.winner, state.revealedFleets, mySide, loserSide]);

  if (!mySide) {
    return <WaitingState label={t("notInMatch")} />;
  }

  if (state.phase === "placing") {
    const placedTypes = new Set(fleet.map((s) => s.type));
    const nextShip = state.fleetSpec.find((spec) => !placedTypes.has(spec.type));
    const fleetReady = isFleetComplete(fleet, state.fleetSpec);
    const iAmReady = state.readySides[mySide];

    const handlePlace = (row: number, col: number) => {
      if (!nextShip || iAmReady || !setPrivateState) return;
      const cells = shipCells(row, col, nextShip.length, orientation, state.boardSize);
      if (!cells || !canPlaceShip(fleet, cells)) return;
      setPrivateState((prev) => ({ fleet: [...prev.fleet, { type: nextShip.type, cells }] }));
    };

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("placing.title")}</h2>

        {iAmReady ? (
          <WaitingState label={t("placing.waitingForOpponentReady")} />
        ) : (
          <>
            <Card className="w-full text-center space-y-1">
              <p className="text-sm text-ink-muted uppercase tracking-widest font-bold">
                {nextShip ? t("placing.placingShip") : t("placing.fleetComplete")}
              </p>
              {nextShip && (
                <p className="text-xl font-bold text-ink">
                  {tShips(nextShip.type)} — {t("placing.cellsLong", { count: nextShip.length })}
                </p>
              )}
            </Card>

            <BoardGrid
              boardSize={state.boardSize}
              onCellClick={handlePlace}
              cellClassName={(_r, _c, cell) =>
                shipTypeAt(fleet, cell) ? "bg-action-primary" : "bg-surface-sunken border border-line"
              }
            />

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
                className="px-5 text-sm"
              >
                {orientation === "horizontal" ? t("placing.orientationHorizontal") : t("placing.orientationVertical")}
              </Button>
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setPrivateState?.({ fleet: randomFleetPlacement(state.fleetSpec, state.boardSize) })}
                className="px-5 text-sm"
              >
                {t("placing.randomButton")}
              </Button>
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={() => setPrivateState?.((prev) => ({ fleet: prev.fleet.slice(0, -1) }))}
                className="px-5 text-sm"
                disabled={fleet.length === 0}
              >
                {t("placing.undoButton")}
              </Button>
            </div>

            <Button
              variant="primary"
              onClick={() => dispatch({ type: "SIDE_READY", side: mySide })}
              disabled={!fleetReady}
              className="max-w-xs"
            >
              {t("placing.readyButton")}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (state.phase === "firing") {
    const isMyTurn = state.turn === mySide;
    const pendingIsMine = state.pendingShot?.shooterSide === mySide;
    const pendingIsOpponents = state.pendingShot && !pendingIsMine;
    const shotsIFired = opponentSide ? state.shots[opponentSide] : {};
    const shotsIReceived = state.shots[mySide];

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2 className="font-display text-2xl text-ink text-center">{t("firing.title")}</h2>

        {pendingIsMine ? (
          <WaitingState label={t("firing.waitingForOpponent")} />
        ) : pendingIsOpponents ? (
          <WaitingState label={t("firing.resolvingYourAnswer")} />
        ) : (
          <p className={`text-lg font-black ${isMyTurn ? "text-action-secondary motion-pulse" : "text-ink-muted"}`}>
            {isMyTurn ? t("firing.yourTurn") : t("firing.opponentTurn")}
          </p>
        )}

        <div className="w-full space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
            {t("firing.targetBoardLabel")}
          </p>
          <BoardGrid
            boardSize={state.boardSize}
            onCellClick={
              isMyTurn && !state.pendingShot
                ? (_r, _c, cell) => {
                    if (shotsIFired[cell]) return;
                    dispatch({ type: "FIRE", side: mySide, cell });
                  }
                : undefined
            }
            cellClassName={(_r, _c, cell) => {
              const result = shotsIFired[cell];
              if (result === "hit") return "bg-action-danger";
              if (result === "miss") return "bg-surface-well";
              return "bg-surface-sunken border border-line";
            }}
          />
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
            {t("firing.yourBoardLabel")}
          </p>
          <BoardGrid
            boardSize={state.boardSize}
            cellClassName={(_r, _c, cell) => {
              const result = shotsIReceived[cell];
              const hasShip = Boolean(shipTypeAt(fleet, cell));
              if (result === "hit") return "bg-action-danger";
              if (result === "miss") return "bg-surface-well";
              return hasShip ? "bg-action-primary" : "bg-surface-sunken border border-line";
            }}
          />
        </div>
      </div>
    );
  }

  if (state.phase === "resolution") {
    const won = state.winner === mySide;
    const revealedFleet = loserSide ? state.revealedFleets[loserSide] : undefined;

    return (
      <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto mt-4 px-4">
        <h2
          className={`font-display text-4xl text-center leading-tight motion-celebrate ${won ? "text-action-primary" : "text-ink"}`}
        >
          {won ? t("resolution.youWon") : t("resolution.youLost")}
        </h2>

        {revealedFleet ? (
          <div className="w-full space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted text-center">
              {t("resolution.revealedFleetLabel")}
            </p>
            <BoardGrid
              boardSize={state.boardSize}
              cellClassName={(_r, _c, cell) => (shipTypeAt(revealedFleet, cell) ? "bg-action-primary" : "bg-surface-sunken")}
            />
          </div>
        ) : (
          <WaitingState label={t("resolution.waitingForReveal")} />
        )}

        {isHost && (
          <Button variant="ghost" onClick={() => dispatch({ type: "PLAY_AGAIN" })} className="mt-4 max-w-xs">
            {t("resolution.nextRoundButton")}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
