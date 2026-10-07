"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { BattleshipAction, BattleshipSide, BattleshipState } from "../reducer";
import { shipTypeAt, type ShipPlacement, type Orientation } from "../placement";
import { weaponCells, weaponForShipType, WEAPON_COST, type WeaponType } from "../weapons";
import { Button } from "@/components/ui";
import { playCue } from "@/lib/feedback";
import { requestLandscape, useIsLandscape } from "@/lib/hooks/useIsLandscape";
import { BoardGrid, EMPTY_CELL, HIT_CELL, MISS_CELL } from "./BoardGrid";
import { WEAPON_COLOR, ToyShip } from "./ToyShip";
import type { ShotAnnouncement } from "./useShotFeedback";

type Shot = WeaponType | "plain";

/** Cells of a shot shape relative to its anchor, for drawing the shape on
 * its key (the board uses `weaponCells` for the real thing). */
const SHAPES: Record<Shot, Array<[number, number]>> = {
  plain: [[0, 0]],
  doubleHorizontal: [
    [0, 0],
    [0, 1],
  ],
  doubleVertical: [
    [0, 0],
    [1, 0],
  ],
  triple: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  cross: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
  ],
};

function ShapeGlyph({ shot, orientation }: { shot: Shot; orientation: Orientation }) {
  const cells = shot === "triple" && orientation === "vertical" ? SHAPES.triple.map(([r, c]) => [c, r]) : SHAPES[shot];
  const rows = Math.max(...cells.map(([r]) => r)) + 1;
  const cols = Math.max(...cells.map(([, c]) => c)) + 1;
  return (
    <span
      aria-hidden="true"
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 0.45rem)`, gridTemplateRows: `repeat(${rows}, 0.45rem)` }}
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const on = cells.some(([r, c]) => r * cols + c === i);
        return <span key={i} className={`rounded-full ${on ? "bg-ink" : ""}`} />;
      })}
    </span>
  );
}

/** Charges as countable red pegs (TASK-0048). */
function Pegs({ count, max = 6, small = false }: { count: number; max?: number; small?: boolean }) {
  const shown = Math.min(count, max);
  const size = small ? "w-2 h-2" : "w-3 h-3";
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className={`${size} rounded-full bg-action-primary shadow-[0_2px_0_var(--color-edge-primary)]`} />
      ))}
      {count > max && <span className="font-display text-sm text-ink">+{count - max}</span>}
    </span>
  );
}

/** The "firing" phase (TASK-0048).
 *
 * Portrait — the radar: one big board (the rival's on my turn, my own on
 * theirs, so I see where I'm being hit) and the other as a mini-map beside
 * the turn banner; tapping the mini-map swaps them. Landscape — the console:
 * both boards side by side with the weapon dock between them. In both, a
 * shot is aimed by tapping the board (its shape appears) and fired with one
 * big "¡Fuego!" in thumb reach; every weapon key shows its shape, its cost
 * in pegs and the colour of the ship that grants it. */
export function Firing({
  state,
  mySide,
  opponentSide,
  opponentName,
  effectiveFleet,
  strikeCells,
  announcement,
  onDismissAnnouncement,
  dispatch,
}: {
  state: BattleshipState;
  mySide: BattleshipSide;
  opponentSide: BattleshipSide;
  opponentName: string;
  effectiveFleet: ShipPlacement[];
  strikeCells: ReadonlySet<string>;
  announcement: ShotAnnouncement | null;
  onDismissAnnouncement: () => void;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");
  const tShips = useTranslations("Battleship.ships");
  const landscape = useIsLandscape();

  const isMyTurn = state.turn === mySide;
  const pendingIsMine = state.pendingShot?.shooterSide === mySide;
  const pendingIsOpponents = Boolean(state.pendingShot && !pendingIsMine);
  const shotsIFired = state.shots[opponentSide];
  const shotsIReceived = state.shots[mySide];
  const myCharges = state.charges[mySide];
  const canAim = isMyTurn && !state.pendingShot;

  const [shot, setShot] = useState<Shot>("plain");
  const [tripleOrientation, setTripleOrientation] = useState<Orientation>("horizontal");
  const [aimCell, setAimCell] = useState<{ row: number; col: number } | null>(null);
  const [view, setView] = useState<"target" | "own">(isMyTurn ? "target" : "own");
  const [rotateHint, setRotateHint] = useState(false);

  // The radar follows the turn: the rival's board when it's mine to shoot,
  // my own when they shoot at me — after a beat, so the result of my own
  // shot stays on screen long enough to see.
  const prevTurnRef = useRef(isMyTurn);
  useEffect(() => {
    if (prevTurnRef.current === isMyTurn) return;
    prevTurnRef.current = isMyTurn;
    if (isMyTurn) {
      playCue("pop");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("target");
      return;
    }
    const timer = setTimeout(() => setView("own"), 1400);
    return () => clearTimeout(timer);
  }, [isMyTurn]);

  // My weapons: every ship-bound weapon whose ship is still afloat.
  const myWeapons = state.fleetSpec
    .map((spec) => ({ shipType: spec.type, weapon: weaponForShipType(spec.type) }))
    .filter(
      (w): w is { shipType: string; weapon: WeaponType } => w.weapon !== null && !state.sunkShips[mySide].includes(w.shipType)
    );

  const aimCells = aimCell
    ? shot === "plain"
      ? [`${aimCell.row}-${aimCell.col}`]
      : weaponCells(shot, aimCell.row, aimCell.col, tripleOrientation, state.boardSize)
    : null;
  const cost = shot === "plain" ? 0 : WEAPON_COST[shot];
  // Worth firing only if at least one cell is still unknown.
  const aimValid = Boolean(aimCells?.length && aimCells.some((c) => !shotsIFired[c]) && myCharges >= cost);

  const fire = () => {
    if (!canAim || !aimCells || !aimValid) return;
    dispatch({ type: "FIRE", side: mySide, cells: aimCells, weapon: shot === "plain" ? null : shot });
    setShot("plain");
    setAimCell(null);
  };

  const targetCellClass = (cell: string) => {
    const result = shotsIFired[cell];
    const striking = strikeCells.has(`${opponentSide}:${cell}`);
    const base = result === "hit" ? HIT_CELL : result === "miss" ? MISS_CELL : EMPTY_CELL;
    if (striking && result) return `${base} ${announcement?.sunk ? "motion-shake" : "motion-strike"}`;
    return base;
  };
  const ownCellClass = (cell: string) => {
    const result = shotsIReceived[cell];
    const striking = strikeCells.has(`${mySide}:${cell}`);
    if (shipTypeAt(effectiveFleet, cell)) return striking ? "bg-transparent motion-shake" : "bg-transparent";
    if (result === "miss") return striking ? `${MISS_CELL} motion-strike` : MISS_CELL;
    return EMPTY_CELL;
  };
  const ownHits = Object.entries(shotsIReceived)
    .filter(([, result]) => result === "hit")
    .map(([cell]) => cell);

  const targetBoard = (opts: { mini?: boolean } = {}) => (
    <BoardGrid
      boardSize={state.boardSize}
      mini={opts.mini}
      coords={!opts.mini}
      onCellClick={!opts.mini && canAim ? (row, col) => setAimCell({ row, col }) : undefined}
      sunkShips={state.sunkShipCells[opponentSide]}
      aim={!opts.mini && aimCells ? { cells: aimCells, valid: aimValid } : null}
      cellClassName={(_r, _c, cell) => targetCellClass(cell)}
    />
  );
  const ownBoard = (opts: { mini?: boolean } = {}) => (
    <BoardGrid
      boardSize={state.boardSize}
      mini={opts.mini}
      coords={!opts.mini}
      ships={effectiveFleet}
      hitCells={ownHits}
      cellClassName={(_r, _c, cell) => ownCellClass(cell)}
    />
  );

  const banner = (
    <div
      className={`flex-1 min-w-0 flex flex-col justify-center rounded-2xl px-3 py-2 text-center ${
        isMyTurn
          ? "bg-action-secondary text-on-secondary shadow-[0_var(--edge-sm)_0_var(--color-edge-secondary)] motion-pop"
          : "bg-surface-sunken text-ink"
      }`}
    >
      <p className="font-display text-xl leading-tight">
        {isMyTurn ? t("firing.myTurnBanner") : t("firing.rivalTurnBanner", { name: opponentName })}
      </p>
      {(pendingIsMine || pendingIsOpponents) && (
        <p className="text-sm font-bold">
          {pendingIsMine ? t("firing.waitingForOpponent") : t("firing.resolvingYourAnswer")}
        </p>
      )}
    </div>
  );

  // Reserved height: the banner comes and goes with every shot and must
  // never push the boards (founder feedback, 2026-08-15).
  const announcementSlot = (
    <div className="w-full h-11 flex items-center justify-center shrink-0" aria-hidden={!announcement}>
      {announcement && !announcement.sunk && (
        <div
          role="status"
          aria-live="assertive"
          className="w-full text-center py-2 px-4 rounded-2xl font-display text-lg bg-ink text-on-ground motion-deal"
        >
          {announcement.text}
        </div>
      )}
    </div>
  );

  const sunkModal = announcement?.sunk && (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 60%, transparent)" }}
      onClick={onDismissAnnouncement}
    >
      <div className="bg-surface-raised rounded-[1.75rem] px-8 py-8 max-w-xs w-full text-center space-y-4 motion-celebrate shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)]">
        {announcement.shipType && (
          <div className="mx-auto h-12" style={{ width: `${(state.fleetSpec.find((s) => s.type === announcement.shipType)?.length ?? 3) * 3}rem` }}>
            <ToyShip
              type={announcement.shipType}
              length={state.fleetSpec.find((s) => s.type === announcement.shipType)?.length ?? 3}
              orientation="horizontal"
              hits={Array.from({ length: 5 }, (_, i) => i)}
            />
          </div>
        )}
        <p className="font-display text-2xl text-ink">{announcement.text}</p>
        <p className="text-base text-ink-muted">{t("firing.tapToContinue")}</p>
      </div>
    </div>
  );

  const dock = (vertical: boolean) => (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-display text-base text-ink">
          {t("firing.chargesWord")} <span className="tabular-nums">{myCharges}</span>
          <Pegs count={myCharges} small={vertical} />
        </span>
        {shot === "triple" && (
          <Button
            variant="ghost"
            fullWidth={false}
            sound="select"
            onClick={() => setTripleOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
            className="!min-h-10 px-3 text-sm !mb-1"
          >
            {t("firing.rotateShot")}
          </Button>
        )}
      </div>
      {!vertical && <p className="text-xs font-bold text-ink-muted -mt-1">{t("firing.chargesHint")}</p>}
      <div className={vertical ? "grid grid-cols-2 gap-2" : "flex gap-2"}>
        {(["plain", ...myWeapons.map((w) => w.weapon)] as Shot[]).map((s) => {
          const keyCost = s === "plain" ? 0 : WEAPON_COST[s];
          const affordable = myCharges >= keyCost;
          const ship = s === "plain" ? null : myWeapons.find((w) => w.weapon === s)?.shipType;
          return (
            <button
              key={s}
              type="button"
              disabled={!canAim || !affordable}
              aria-pressed={shot === s}
              aria-label={
                s === "plain"
                  ? t("firing.plainShotLabel")
                  : t("firing.weaponLabel", { weapon: t(`firing.weapon.${s}`), cost: keyCost, ship: tShips(ship ?? "") })
              }
              onPointerDown={() => canAim && affordable && playCue("select")}
              onClick={() => setShot(s)}
              className={`flex-1 min-w-0 flex flex-col items-center gap-1 rounded-xl border-2 px-1 pt-2 pb-1.5 transition-[transform,box-shadow] duration-75 active:translate-y-[var(--edge-sm)] active:shadow-none disabled:opacity-40 disabled:shadow-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                shot === s
                  ? "bg-action-secondary border-transparent shadow-[0_var(--edge-sm)_0_var(--color-edge-secondary)]"
                  : "bg-surface-raised border-line shadow-[0_var(--edge-sm)_0_var(--color-edge-raised)]"
              }`}
            >
              <ShapeGlyph shot={s} orientation={tripleOrientation} />
              <span className="font-display text-xs leading-none text-ink">{t(`firing.weaponShort.${s}`)}</span>
              {s === "plain" ? (
                <span className="text-[0.65rem] font-bold text-ink-muted leading-none">{t("firing.free")}</span>
              ) : (
                <Pegs count={keyCost} small />
              )}
              {s !== "plain" && (
                <span className="w-6 h-1 rounded-full" style={{ background: WEAPON_COLOR[s] }} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      <Button
        variant="primary"
        sound={null}
        disabled={!canAim || !aimValid}
        onClick={fire}
        className="text-2xl"
      >
        {!canAim
          ? t("firing.waitForTurn")
          : !aimCells
            ? t("firing.aimFirst")
            : !aimValid
              ? t("firing.alreadyFired")
              : t("firing.fireButton")}
      </Button>
    </div>
  );

  if (landscape) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {sunkModal}
        {/* One row for the turn and the last shot: landscape height is
            precious. */}
        <div className="flex gap-3 items-center">
          {banner}
          <div className="flex-1 min-w-0">{announcementSlot}</div>
        </div>
        <div className="flex gap-3 items-start justify-center w-full">
          <div className="flex-1 min-w-0 space-y-1" style={{ maxWidth: "min(40vw, calc(100dvh - 12.5rem))" }}>
            <p className="text-sm font-bold text-ink-muted text-center">{t("firing.ownFleetLabel")}</p>
            {ownBoard()}
          </div>
          <div className="w-40 shrink-0">{dock(true)}</div>
          <div className="flex-1 min-w-0 space-y-1" style={{ maxWidth: "min(40vw, calc(100dvh - 12.5rem))" }}>
            <p className="text-sm font-bold text-ink-muted text-center">{t("firing.rivalBoardLabel", { name: opponentName })}</p>
            {targetBoard()}
          </div>
        </div>
      </div>
    );
  }

  const showingTarget = view === "target";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {sunkModal}
      <div className="w-full flex items-stretch gap-3">
        {banner}
        {/* The mini-map: the board that isn't big right now. Tap to swap. */}
        <button
          type="button"
          onClick={() => {
            playCue("select");
            setView(showingTarget ? "own" : "target");
          }}
          aria-label={t("firing.swapBoardsLabel")}
          className="w-20 shrink-0 rounded-xl bg-surface-raised p-1 shadow-[0_var(--edge-sm)_0_var(--color-edge-raised)] active:translate-y-[var(--edge-sm)] active:shadow-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus"
        >
          {showingTarget ? ownBoard({ mini: true }) : targetBoard({ mini: true })}
          <span className="block text-[0.6rem] font-bold text-ink-muted leading-tight mt-0.5">
            {showingTarget ? t("firing.ownFleetLabel") : opponentName}
          </span>
        </button>
      </div>

      {announcementSlot}

      <div className="w-full space-y-1">
        <p className="text-sm font-bold text-ink-muted text-center">
          {showingTarget ? t("firing.rivalBoardLabel", { name: opponentName }) : t("firing.ownFleetLabel")}
        </p>
        {showingTarget ? targetBoard() : ownBoard()}
      </div>

      {/* The dock only while it's mine to shoot; on the rival's turn the
          screen is theirs to watch. */}
      {isMyTurn &&
        (showingTarget ? (
          dock(false)
        ) : (
          <Button variant="primary" onClick={() => setView("target")} className="text-xl">
            {t("firing.showRivalBoard", { name: opponentName })}
          </Button>
        ))}

      <div className="w-full flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          fullWidth={false}
          onClick={async () => {
            const locked = await requestLandscape();
            setRotateHint(!locked);
          }}
          className="px-4 text-base"
        >
          {t("firing.playLandscape")}
        </Button>
        {rotateHint && <p className="text-sm font-bold text-ink-muted text-center">{t("firing.rotatePhoneHint")}</p>}
      </div>
    </div>
  );
}
