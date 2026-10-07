"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { KeyRow, ToyConfetti } from "@/components/ui";
import type { FeedbackCue } from "@/lib/feedback";
import { useCueOnMount } from "@/lib/feedback/react";
import type { ImpostorState } from "../reducer";
import { MaskPicto, BubblePicto, TiePicto, OopsPicto } from "./Pictos";

/** Pieces shared by the multi-device (`Player.tsx`) and pass-and-play
 * (`SingleDevice.tsx`) views, so both read as the same game (BDR-0002). */

export function ImpostorCountPicker({
  value,
  maxImpostors,
  onChange,
}: {
  value: number;
  maxImpostors: number;
  onChange: (n: number) => void;
}) {
  const tConfig = useTranslations("games.impostor.config");
  const nextLocked = [1, 2, 3].find((n) => n > maxImpostors);
  return (
    <KeyRow
      label={tConfig("impostorCount")}
      value={value}
      onChange={onChange}
      options={[1, 2, 3].map((n) => ({ value: n, label: String(n), disabled: n > maxImpostors }))}
      hint={nextLocked ? tConfig("needsPlayersHint", { n: nextLocked, min: 2 * nextLocked + 1 }) : undefined}
    />
  );
}

export function HintDifficultyPicker({
  value,
  onChange,
}: {
  value: ImpostorState["hintDifficulty"];
  onChange: (value: ImpostorState["hintDifficulty"]) => void;
}) {
  const tConfig = useTranslations("games.impostor.config");
  return (
    <KeyRow
      label={tConfig("hintDifficulty")}
      value={value}
      onChange={onChange}
      options={[
        { value: "none", label: tConfig("hintNoneShort") },
        { value: "hard", label: tConfig("hintHardShort") },
        { value: "easy", label: tConfig("hintEasyShort") },
      ]}
      hint={tConfig(value === "none" ? "hintNone" : value === "hard" ? "hintHard" : "hintEasy")}
    />
  );
}

/** What a player reads on the capsule card. The impostor sees the mask and
 * (if the host allows) a clue; everyone else sees the word. */
export function RoleRevealContent({
  isImpostor,
  hint,
  word,
}: {
  isImpostor: boolean;
  hint?: string;
  word?: string;
}) {
  const t = useTranslations("Impostor");
  if (isImpostor) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MaskPicto size={72} className="text-action-primary" />
        <h3 className="font-display text-3xl text-action-primary leading-tight">{t("roleReveal.youAreImpostor")}</h3>
        {hint && (
          <div className="w-full bg-danger-surface rounded-2xl px-4 py-3">
            <p className="text-base font-bold text-on-danger-surface">{t("roleReveal.yourClue")}</p>
            <p className="text-xl font-bold text-ink">{hint}</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <BubblePicto size={64} className="text-success" />
      <p className="text-lg font-bold text-ink-muted">{t("roleReveal.secretWordIs")}</p>
      <p className="font-display text-4xl text-success leading-tight">{word}</p>
    </div>
  );
}

/** The capsule's closed-state label. */
export function RoleRevealHidden() {
  const t = useTranslations("Impostor");
  return (
    <div className="text-center space-y-1">
      <p className="font-display text-xl text-ink">{t("roleReveal.holdToReveal")}</p>
      <p className="text-base text-ink-muted">{t("roleReveal.dontLetOthersLook")}</p>
    </div>
  );
}

/** A big colored block for a round's outcome (BDR-0002: a plastic piece in
 * the game's color), with its pictogram. */
export function OutcomeBlock({
  tone,
  picto,
  title,
  cue = "win",
  confetti = false,
  children,
}: {
  tone: "impostor" | "innocent" | "neutral";
  picto: ReactNode;
  title: string;
  /** Sound + vibration when the block appears (M6.5 phase 3). */
  cue?: FeedbackCue | null;
  /** Throw toy confetti — for the end of a round, not mid-round news. */
  confetti?: boolean;
  children?: ReactNode;
}) {
  useCueOnMount(cue);
  const toneClasses = {
    impostor: "bg-game-impostor text-on-game-impostor shadow-[0_var(--edge-lg)_0_var(--color-edge-game-impostor)]",
    innocent: "bg-success text-on-success shadow-[0_var(--edge-lg)_0_var(--color-edge-success)]",
    neutral: "bg-surface-sunken text-ink shadow-[inset_0_3px_0_var(--color-edge-sunken)]",
  }[tone];
  return (
    <div className={`motion-celebrate w-full rounded-[1.75rem] px-5 py-6 flex flex-col items-center gap-3 text-center ${toneClasses}`}>
      {confetti && <ToyConfetti />}
      {picto}
      <h2 className="font-display text-3xl leading-tight">{title}</h2>
      {children}
    </div>
  );
}

/** Who got voted out, and whether they were the impostor. */
export function EliminationOutcome({
  elimination,
  name,
}: {
  elimination: ImpostorState["lastElimination"];
  name: string;
}) {
  const t = useTranslations("Impostor");
  if (!elimination?.eliminatedId) {
    return <OutcomeBlock tone="neutral" cue="pop" picto={<TiePicto size={64} />} title={t("eliminationResult.tie")} />;
  }
  if (elimination.wasImpostor) {
    return (
      <OutcomeBlock
        tone="impostor"
        cue="correct"
        picto={<MaskPicto size={72} />}
        title={t("eliminationResult.wasImpostor", { name })}
      >
        <p className="text-lg font-semibold">{t("eliminationResult.gameContinues")}</p>
      </OutcomeBlock>
    );
  }
  return (
    <OutcomeBlock tone="neutral" cue="wrong" picto={<OopsPicto size={64} />} title={t("eliminationResult.wasInnocent", { name })}>
      <p className="text-lg text-ink-muted font-semibold">{t("eliminationResult.gameContinues")}</p>
    </OutcomeBlock>
  );
}
