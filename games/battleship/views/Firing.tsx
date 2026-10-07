"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BattleshipAction, BattleshipSide, BattleshipState } from "../reducer";
import { shipTypeAt, type ShipPlacement, type Orientation } from "../placement";
import { weaponCells, weaponForShipType, WEAPON_COST, type WeaponType } from "../weapons";
import { Button, KeyRow, WaitingState } from "@/components/ui";
import { BoardGrid, EMPTY_CELL } from "./BoardGrid";
import type { ShotAnnouncement } from "./useShotFeedback";

type BoardLayout = "stacked" | "side-by-side" | "one-at-a-time";
const BOARD_LAYOUT_STORAGE_KEY = "nexplay:battleship-board-layout";

function isBoardLayout(value: string | null): value is BoardLayout {
  return value === "stacked" || value === "side-by-side" || value === "one-at-a-time";
}

/** The "firing" phase: the target board, my own board, the weapon panel and
 * the per-device board layout preference. */
export function Firing({
  state,
  mySide,
  opponentSide,
  effectiveFleet,
  strikeCells,
  announcement,
  onDismissAnnouncement,
  dispatch,
}: {
  state: BattleshipState;
  mySide: BattleshipSide;
  opponentSide: BattleshipSide;
  effectiveFleet: ShipPlacement[];
  strikeCells: ReadonlySet<string>;
  announcement: ShotAnnouncement | null;
  onDismissAnnouncement: () => void;
  dispatch: (action: BattleshipAction) => void;
}) {
  const t = useTranslations("Battleship");

  // M4b weapon aiming: `null` selectedWeapon means the plain, free, always-
  // available single-cell shot. Picking a weapon just arms aiming mode — it
  // doesn't fire until `aimCell` is also set and confirmed, so a shape
  // preview can be shown first (weapons cost charges; a plain shot doesn't
  // need this two-step confirmation and still fires on a single tap).
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType | null>(null);
  const [weaponOrientation, setWeaponOrientation] = useState<Orientation>("horizontal");
  const [aimCell, setAimCell] = useState<{ row: number; col: number } | null>(null);

  // Per-device display preference (not game state — never touches the
  // reducer or syncs between players). Read lazily on first render rather
  // than via a mount effect, so there's no cascading re-render from setting
  // state inside an effect body.
  const [layout, setLayout] = useState<BoardLayout>(() => {
    try {
      const stored = localStorage.getItem(BOARD_LAYOUT_STORAGE_KEY);
      return isBoardLayout(stored) ? stored : "stacked";
    } catch {
      return "stacked";
    }
  });
  const [singleBoardView, setSingleBoardView] = useState<"target" | "own">("target");
  useEffect(() => {
    try {
      localStorage.setItem(BOARD_LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Losing this convenience isn't worth crashing the app over.
    }
  }, [layout]);

  const isMyTurn = state.turn === mySide;
  const pendingIsMine = state.pendingShot?.shooterSide === mySide;
  const pendingIsOpponents = state.pendingShot && !pendingIsMine;
  const shotsIFired = state.shots[opponentSide];
  const shotsIReceived = state.shots[mySide];
  const myCharges = state.charges[mySide];

  // M4b: every weapon whose ship is still afloat on my own side — a weapon
  // disappears the instant its ship is sunk, regardless of charges (the
  // "ship-bound" half of the founder's design). Affordability is checked
  // separately per weapon so the selector can show what's still out of
  // reach rather than hiding it entirely.
  const myWeapons = state.fleetSpec
    .map((spec) => ({ shipType: spec.type, weapon: weaponForShipType(spec.type) }))
    .filter(
      (w): w is { shipType: string; weapon: WeaponType } => w.weapon !== null && !state.sunkShips[mySide].includes(w.shipType)
    );

  const aimGhostCells =
    selectedWeapon && aimCell ? weaponCells(selectedWeapon, aimCell.row, aimCell.col, weaponOrientation, state.boardSize) : null;
  // A shot is only worth confirming if at least one of its cells is still
  // unfired-at — same "some risk is on you" rule the plain shot already has
  // via `shotsIFired[cell]`, just tolerant of a partially-wasted shape.
  const aimGhostValid = Boolean(aimGhostCells?.length && aimGhostCells.some((c) => !shotsIFired[c]));
  const aimCost = selectedWeapon ? WEAPON_COST[selectedWeapon] : 0;

  const selectWeapon = (weapon: WeaponType | null) => {
    setSelectedWeapon(weapon);
    setAimCell(null);
  };

  const confirmWeaponShot = () => {
    if (!selectedWeapon || !aimGhostCells || !aimGhostValid || myCharges < aimCost) return;
    dispatch({ type: "FIRE", side: mySide, cells: aimGhostCells, weapon: selectedWeapon });
    setSelectedWeapon(null);
    setAimCell(null);
  };

  const targetBoard = (
    <div className="w-full space-y-2">
      <p className="text-base font-bold text-ink-muted text-center">{t("firing.targetBoardLabel")}</p>
      <BoardGrid
        boardSize={state.boardSize}
        onCellClick={
          isMyTurn && !state.pendingShot
            ? (row, col, cell) => {
                if (selectedWeapon) {
                  setAimCell({ row, col });
                  return;
                }
                if (shotsIFired[cell]) return;
                dispatch({ type: "FIRE", side: mySide, cells: [cell], weapon: null });
              }
            : undefined
        }
        sunkShips={state.sunkShipCells[opponentSide]}
        aim={aimGhostCells ? { cells: aimGhostCells, valid: aimGhostValid } : null}
        cellClassName={(_r, _c, cell) => {
          const result = shotsIFired[cell];
          const striking = strikeCells.has(`${opponentSide}:${cell}`);
          // Colour always follows the result (founder feedback, 2026-08-15:
          // a miss used to flash red); the strike only adds motion on top.
          const base = result === "hit" ? "bg-action-danger" : result === "miss" ? "bg-water" : null;
          if (striking && base) return `${base} ${announcement?.sunk ? "motion-shake" : "motion-strike"}`;
          if (base) return base;
          return EMPTY_CELL;
        }}
      />
    </div>
  );

  const ownBoard = (
    <div className="w-full space-y-2">
      <p className="text-base font-bold text-ink-muted text-center">{t("firing.yourBoardLabel")}</p>
      <BoardGrid
        boardSize={state.boardSize}
        ships={effectiveFleet}
        hitCells={Object.entries(shotsIReceived)
          .filter(([, result]) => result === "hit")
          .map(([cell]) => cell)}
        cellClassName={(_r, _c, cell) => {
          const result = shotsIReceived[cell];
          const hasShip = Boolean(shipTypeAt(effectiveFleet, cell));
          const striking = strikeCells.has(`${mySide}:${cell}`);
          // Same result-follows-colour rule as the target board. A cell
          // holding one of my ships stays transparent either way so the ship
          // art shows through, with the hit dots layered on top.
          if (hasShip) return striking ? "bg-transparent motion-shake" : "bg-transparent";
          if (result === "miss") return striking ? "bg-water motion-strike" : "bg-water";
          return EMPTY_CELL;
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="font-display text-3xl text-ink text-center">{t("firing.title")}</h2>

      {/* Founder feedback (2026-08-15): "se mueve la pantalla del cel cuando
          se dispara". The banner slot is always in the layout at a fixed
          height and only its *contents* toggle, so nothing below it ever
          reflows. Kept empty rather than removed when idle: the reserved
          space is the fix. */}
      <div className="w-full h-14 flex items-center justify-center shrink-0" aria-hidden={!announcement}>
        {announcement && !announcement.sunk && (
          <div
            role="status"
            aria-live="assertive"
            className="w-full text-center py-3 px-4 rounded-2xl font-display text-xl bg-surface-sunken text-ink motion-deal"
          >
            {announcement.text}
          </div>
        )}
      </div>

      {announcement?.sunk && (
        <div
          role="alertdialog"
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-ink) 60%, transparent)" }}
          onClick={onDismissAnnouncement}
        >
          <div className="bg-surface-raised rounded-[1.75rem] px-8 py-8 max-w-xs w-full text-center space-y-4 motion-celebrate shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)]">
            {announcement.shipType && (
              // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, no next/image optimization needed for a small modal icon
              <img
                src={`/battleship/${announcement.shipType}.png`}
                alt=""
                aria-hidden="true"
                className="w-20 h-20 mx-auto object-contain"
              />
            )}
            <p className="font-display text-2xl text-ink">{announcement.text}</p>
            <p className="text-base text-ink-muted">{t("firing.tapToContinue")}</p>
          </div>
        </div>
      )}

      {/* Same reserved-slot rule: this swaps between a WaitingState and a
          one-line label on every turn, and they are not the same height. */}
      <div className="w-full h-12 flex items-center justify-center shrink-0">
        {pendingIsMine ? (
          <WaitingState label={t("firing.waitingForOpponent")} />
        ) : pendingIsOpponents ? (
          <WaitingState label={t("firing.resolvingYourAnswer")} />
        ) : (
          <p className={`font-display text-xl ${isMyTurn ? "text-accent motion-pulse" : "text-ink-muted"}`}>
            {isMyTurn ? t("firing.yourTurn") : t("firing.opponentTurn")}
          </p>
        )}
      </div>

      {/* The boards sit above every control that can grow or vanish: the
          weapon panel unmounts the instant you fire and remounts when your
          turn comes back, and used to shove both boards up and down by its
          full height every turn. Anything that resizes now only pushes what
          is underneath it, and the board stays put under the player's
          thumb — which also puts the controls within thumb reach. */}
      {layout === "stacked" && (
        <>
          {targetBoard}
          {ownBoard}
        </>
      )}

      {layout === "side-by-side" && (
        <div className="flex flex-row gap-3 w-full justify-center items-start">
          <div className="flex-1 min-w-0">{targetBoard}</div>
          <div className="flex-1 min-w-0">{ownBoard}</div>
        </div>
      )}

      {layout === "one-at-a-time" && (
        <>
          <KeyRow
            label={t("firing.boardChoiceLabel")}
            value={singleBoardView}
            onChange={setSingleBoardView}
            options={[
              { value: "target", label: t("firing.targetBoardLabel") },
              { value: "own", label: t("firing.yourBoardLabel") },
            ]}
          />
          {singleBoardView === "target" ? targetBoard : ownBoard}
        </>
      )}

      {isMyTurn && !state.pendingShot && (
        <div className="w-full space-y-3 bg-surface-sunken rounded-2xl px-3 py-3 text-center">
          <p className="font-display text-lg text-ink">{t("firing.chargesLabel", { count: myCharges })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              fullWidth={false}
              active={selectedWeapon === null}
              onClick={() => selectWeapon(null)}
              className="px-4 text-base"
            >
              {t("firing.plainShotButton")}
            </Button>
            {myWeapons.map(({ weapon }) => (
              <Button
                key={weapon}
                variant="secondary"
                fullWidth={false}
                active={selectedWeapon === weapon}
                disabled={myCharges < WEAPON_COST[weapon]}
                onClick={() => selectWeapon(weapon)}
                className="px-4 text-base"
              >
                {t(`firing.weapon.${weapon}`)} ({WEAPON_COST[weapon]})
              </Button>
            ))}
          </div>

          {selectedWeapon === "triple" && (
            <Button
              variant="ghost"
              fullWidth={false}
              onClick={() => setWeaponOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
              className="px-4 text-base mx-auto"
            >
              {weaponOrientation === "horizontal" ? t("placing.orientationHorizontal") : t("placing.orientationVertical")}
            </Button>
          )}

          {selectedWeapon && !aimGhostCells && <p className="text-base text-ink-muted">{t("firing.aimHint")}</p>}

          {selectedWeapon && aimGhostCells && (
            <Button variant="primary" onClick={confirmWeaponShot} disabled={!aimGhostValid}>
              {t("firing.confirmShotButton", { cost: aimCost })}
            </Button>
          )}
        </div>
      )}

      <KeyRow
        label={t("firing.layoutLabel")}
        value={layout}
        onChange={setLayout}
        options={[
          { value: "stacked", label: t("firing.layoutStacked") },
          { value: "side-by-side", label: t("firing.layoutSideBySide") },
          { value: "one-at-a-time", label: t("firing.layoutOneAtATime") },
        ]}
      />
    </div>
  );
}
