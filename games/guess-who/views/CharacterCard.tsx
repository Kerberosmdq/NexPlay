"use client";

import { useTranslations } from "next-intl";
import type { GuessWhoCharacter, HairColor } from "../content/types";

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

/** Placeholder character representation — a trait-based card, not an
 * illustration. Real portraits are a deliberate follow-up
 * (docs/09_ai/tasks/TASK-0038-guess-who.md); every trait is still fully
 * legible here so the game is completely playable before that art lands,
 * and swapping it in later only touches this component. */
export function CharacterCard({ character, crossedOut = false, selected = false, onClick, size = "grid" }: CharacterCardProps) {
  const t = useTranslations("GuessWho.traits");
  const { traits } = character;
  const isLarge = size === "large";

  const facialHairLabel = traits.facialHair === "ninguno" ? null : t(`facialHair.${traits.facialHair}`);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl p-2 border transition-opacity ${
        selected ? "border-focus bg-surface-raised" : "border-line bg-surface-sunken"
      } ${crossedOut ? "opacity-30" : "opacity-100"} ${onClick ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" : ""}`}
    >
      <div className="relative">
        <div
          className={`rounded-full flex items-center justify-center font-display text-on-primary ${
            isLarge ? "w-24 h-24 text-4xl" : "w-12 h-12 text-lg"
          }`}
          style={{ backgroundColor: HAIR_SWATCH[traits.hairColor] }}
        >
          {character.name[0]}
        </div>
        {traits.glasses && (
          <span className={`absolute ${isLarge ? "text-2xl -top-1 -left-1" : "text-sm -top-0.5 -left-0.5"}`} aria-hidden="true">
            👓
          </span>
        )}
        {traits.hat && (
          <span className={`absolute ${isLarge ? "text-3xl -top-4 left-1/2 -translate-x-1/2" : "text-base -top-2 left-1/2 -translate-x-1/2"}`} aria-hidden="true">
            🎩
          </span>
        )}
        {traits.earrings && (
          <span className={`absolute ${isLarge ? "text-xl -bottom-1 -right-1" : "text-xs -bottom-0.5 -right-0.5"}`} aria-hidden="true">
            💎
          </span>
        )}
        {crossedOut && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-full h-0.5 bg-action-danger rotate-45" />
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
