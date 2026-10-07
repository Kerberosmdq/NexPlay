"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Picto, ToyConfetti, type PictoProps } from "@/components/ui";
import type { FeedbackCue } from "@/lib/feedback";
import { useCueOnMount } from "@/lib/feedback/react";
import { GUESS_WHO_CHARACTERS } from "../content/characters";
import { CharacterCard } from "./CharacterCard";

/** BDR-0002 pieces shared by both Guess Who views. */

/** The game's pictogram: a face with glasses. */
export function FacePicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="24" r="18" />
      <circle cx="17" cy="21" r="4.5" strokeWidth="3" />
      <circle cx="31" cy="21" r="4.5" strokeWidth="3" />
      <path d="M21.5 21h5M18 31c3.3 2.4 8.7 2.4 12 0" strokeWidth="3" />
    </Picto>
  );
}

/** The 32-card board, with how many are still standing and what a tap
 * does right now (flip a card down, or make the guess). */
export function CharacterBoard({
  crossedOut,
  guessing,
  disabled,
  onCardClick,
}: {
  crossedOut: Set<string>;
  guessing: boolean;
  disabled: boolean;
  onCardClick: (characterId: string) => void;
}) {
  const t = useTranslations("GuessWho");
  const remaining = GUESS_WHO_CHARACTERS.length - crossedOut.size;
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className={`text-base font-bold ${guessing ? "text-action-primary" : "text-ink-muted"}`}>
          {guessing ? t("guessHint") : t("flipHint")}
        </p>
        <span className="shrink-0 font-display text-lg text-on-game-guess-who bg-game-guess-who rounded-xl px-3 py-0.5 shadow-[0_var(--edge-sm)_0_var(--color-edge-game-guess-who)]">
          {t("remainingCount", { n: remaining })}
        </span>
      </div>
      <div
        className={`grid grid-cols-4 sm:grid-cols-8 gap-2 w-full rounded-2xl p-1 ${
          guessing ? "outline outline-3 outline-offset-2 outline-action-primary" : ""
        }`}
      >
        {GUESS_WHO_CHARACTERS.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            crossedOut={crossedOut.has(character.id)}
            sound={guessing ? "select" : "flip"}
            onClick={disabled ? undefined : () => onCardClick(character.id)}
          />
        ))}
      </div>
    </div>
  );
}

/** Flip a card down, or back up. */
export function toggleCrossedOut(prev: Set<string>, characterId: string): Set<string> {
  const next = new Set(prev);
  if (next.has(characterId)) next.delete(characterId);
  else next.add(characterId);
  return next;
}

/** The end of a match as a purple plastic block. */
export function ResultBlock({
  title,
  cue = "win",
  children,
}: {
  title: string;
  /** "win" (with confetti) for the winner's screen, "lose" on the loser's. */
  cue?: FeedbackCue;
  children?: ReactNode;
}) {
  useCueOnMount(cue);
  return (
    <div className="motion-celebrate w-full rounded-[1.75rem] bg-game-guess-who text-on-game-guess-who px-5 py-6 flex flex-col items-center gap-2 shadow-[0_var(--edge-lg)_0_var(--color-edge-game-guess-who)]">
      {cue === "win" && <ToyConfetti />}
      <FacePicto size={64} />
      <h2 className="font-display text-3xl text-center leading-tight">{title}</h2>
      {children}
    </div>
  );
}
