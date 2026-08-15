"use client";

import { useTranslations } from "next-intl";
import type { GuessWhoCharacter, HairColor } from "../content/types";
import { CHARACTER_IDS_WITH_ART } from "../content/artManifest";

const HAIR_SWATCH: Record<HairColor, string> = {
  negro: "#3a3a3a",
  castaño: "#6b4423",
  rubio: "#d4a017",
  pelirrojo: "#b5482f",
};

interface CharacterCardProps {
  character: GuessWhoCharacter;
  /** Personal elimination bookkeeping — plain visual state, never
   * synced anywhere (it isn't a secret, just scratch paper). */
  crossedOut?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** Compact for the 32-card grid; full size for "this is your character". */
  size?: "grid" | "large";
}

/** One character in the 32-card grid. Renders the real portrait when the
 * character has art, and otherwise falls back to a trait-based placeholder
 * that keeps every trait legible (docs/09_ai/tasks/TASK-0038-guess-who.md) —
 * the whole roster has art today, but the fallback stays so adding a
 * character never ships a blank card. */
export function CharacterCard({ character, crossedOut = false, selected = false, onClick, size = "grid" }: CharacterCardProps) {
  const t = useTranslations("GuessWho.traits");
  const { traits } = character;
  const isLarge = size === "large";

  const facialHairLabel = traits.facialHair === "ninguno" ? null : t(`facialHair.${traits.facialHair}`);
  const hasArt = CHARACTER_IDS_WITH_ART.has(character.id);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl border transition-opacity ${isLarge ? "p-2" : "p-1"} ${
        selected ? "border-focus bg-surface-raised" : "border-line bg-surface-sunken"
      } ${crossedOut ? "opacity-30" : "opacity-100"} ${onClick ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" : ""}`}
    >
      <div className={`relative ${isLarge ? "w-28" : "w-full"}`}>
        {hasArt ? (
          // Portraits are head-and-shoulders at roughly 2:3, so a circular
          // `object-cover` frame (what this used to be) cut the top of every
          // hat off — the one trait a player most needs to see. A portrait-
          // shaped box with `object-contain` shows the whole figure instead.
          // eslint-disable-next-line @next/next/no-img-element -- a fixed local asset, no next/image optimization needed for a small repeated card portrait
          <img
            src={`/guess-who/${character.id}.png`}
            alt=""
            aria-hidden="true"
            className="w-full aspect-[2/3] object-contain rounded-xl bg-surface-raised"
          />
        ) : (
          <div
            className={`mx-auto rounded-full flex items-center justify-center font-display text-on-primary ${
              isLarge ? "w-24 h-24 text-4xl" : "w-12 h-12 text-lg"
            }`}
            style={{ backgroundColor: HAIR_SWATCH[traits.hairColor] }}
          >
            {character.name[0]}
          </div>
        )}
        {/* Real art already depicts these traits directly — the emoji
            overlays exist only to make the placeholder's plain circle
            legible, so they'd be redundant clutter once art lands. */}
        {!hasArt && traits.glasses && (
          <span className={`absolute ${isLarge ? "text-2xl -top-1 -left-1" : "text-sm -top-0.5 -left-0.5"}`} aria-hidden="true">
            👓
          </span>
        )}
        {!hasArt && traits.hat && (
          <span className={`absolute ${isLarge ? "text-3xl -top-4 left-1/2 -translate-x-1/2" : "text-base -top-2 left-1/2 -translate-x-1/2"}`} aria-hidden="true">
            🎩
          </span>
        )}
        {!hasArt && traits.earrings && (
          <span className={`absolute ${isLarge ? "text-xl -bottom-1 -right-1" : "text-xs -bottom-0.5 -right-0.5"}`} aria-hidden="true">
            💎
          </span>
        )}
        {crossedOut && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            {/* Wider than the box so the 45° strike still spans the whole
                taller-than-wide portrait frame; `shrink-0` because the
                centering flex parent would otherwise clamp it back to the
                frame's width and leave the slash short of the edges. */}
            <div className="w-[150%] shrink-0 h-0.5 bg-action-danger rotate-45" />
          </div>
        )}
      </div>
      <p className={`font-bold text-ink text-center leading-tight ${isLarge ? "text-lg" : "text-xs"}`}>{character.name}</p>
      {isLarge && (
        <p className="text-xs text-ink-muted text-center">
          {t("hairSummary", { color: t(`hairColor.${traits.hairColor}`), length: t(`hairLength.${traits.hairLength}`) })}
          {facialHairLabel ? ` · ${facialHairLabel}` : ""}
        </p>
      )}
    </Wrapper>
  );
}
