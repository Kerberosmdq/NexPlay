"use client";

import { useTranslations } from "next-intl";
import { KeyRow } from "@/components/ui";
import type { WhoAmIWord } from "../content/types";
import { GotItPicto, MissedPicto } from "./Pictos";

/** Pieces shared by the multi-device (`Player.tsx`) and pass-and-play
 * (`SingleDevice.tsx`) views, so both read as the same game (BDR-0002). */

const TIMER_OPTIONS = [
  { value: 180, key: "time3min", label: "3" },
  { value: 300, key: "time5min", label: "5" },
  { value: 420, key: "time7min", label: "7" },
  { value: 600, key: "time10min", label: "10" },
  { value: 0, key: "timeUnlimited", label: "∞" },
] as const;

/** Round length as toy keys (minutes), with the full wording underneath. */
export function TimerPicker({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const tConfig = useTranslations("games.who-am-i.config");
  const selected = TIMER_OPTIONS.find((o) => o.value === value) ?? TIMER_OPTIONS[1];
  return (
    <KeyRow
      label={tConfig("timerSecondsMinutes")}
      value={value}
      onChange={onChange}
      options={TIMER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      hint={tConfig(selected.key)}
    />
  );
}

/** The forehead card: the word and its picture, big enough to read from
 * across the table — a yellow plastic card in the game's own color. */
export function WordCard({ word }: { word?: WhoAmIWord }) {
  return (
    <div className="w-full rounded-[1.75rem] bg-game-who-am-i text-on-game-who-am-i px-6 py-8 flex flex-col items-center gap-3 shadow-[0_var(--edge-lg)_0_var(--color-edge-game-who-am-i)]">
      <span className="text-8xl leading-none" aria-hidden="true">
        {word?.emoji}
      </span>
      <p className="font-display text-5xl leading-tight text-center break-words">{word?.word}</p>
    </div>
  );
}

/** The round clock, as a dark display with tabular digits. */
export function RoundClock({ label }: { label: string }) {
  return (
    <div className="font-mono text-3xl font-bold tabular-nums text-on-ground bg-ink rounded-2xl px-6 py-2 shadow-[0_var(--edge-sm)_0_var(--color-edge-ground)]">
      {label}
    </div>
  );
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** A finished player's own result panel (multi-device). */
export function OwnResult({ guessed, word }: { guessed: boolean; word?: WhoAmIWord }) {
  const t = useTranslations("WhoAmI");
  return (
    <div
      className={`w-full rounded-[1.75rem] px-6 py-6 flex flex-col items-center gap-2 text-center ${
        guessed ? "bg-success-surface text-on-success-surface" : "bg-danger-surface text-on-danger-surface"
      }`}
    >
      {guessed ? <GotItPicto size={56} /> : <MissedPicto size={56} />}
      <p className="font-display text-xl">{guessed ? t("playing.youGuessed") : t("playing.youLost")}</p>
      <p className="font-display text-3xl text-ink">
        <span aria-hidden="true">{word?.emoji}</span> {word?.word}
      </p>
    </div>
  );
}

/** A scoreboard row's icon: guessed or not. */
export function GuessIcon({ guessed }: { guessed: boolean }) {
  return guessed ? (
    <GotItPicto size={28} className="text-success shrink-0" />
  ) : (
    <MissedPicto size={28} className="text-action-danger shrink-0" />
  );
}
