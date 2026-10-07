"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { generateRoomCode, isValidRoomCode } from "@/lib/realtime";
import { rememberFamilyNames } from "@/lib/family/roster";
import { Button, Card, CodeInput, Field, LanguageSwitcher, NexMark, SoundToggle } from "@/components/ui";

export interface RoomLobbyProps {
  onStartSingleDevice: (displayName: string) => void;
  onCreateRoom: (displayName: string, code: string) => void;
  onJoinRoom: (displayName: string, code: string) => void;
}

export function RoomLobby({
  onStartSingleDevice,
  onCreateRoom,
  onJoinRoom,
}: RoomLobbyProps) {
  const t = useTranslations("Lobby");
  const [mode, setMode] = useState<"multi-device" | "single-device">("multi-device");
  const [displayName, setDisplayName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const name = displayName.trim() || t("defaultHostName");
    const code = generateRoomCode();
    setError(null);
    onCreateRoom(name, code);
  };

  const handleJoin = () => {
    const name = displayName.trim() || t("defaultPlayerName");
    const code = joinCodeInput.trim().toUpperCase();

    if (!isValidRoomCode(code)) {
      setError(t("invalidCodeError"));
      return;
    }

    setError(null);
    onJoinRoom(name, code);
  };

  const handleSingleDevice = () => {
    const typedName = displayName.trim();
    const name = typedName || t("defaultSingleDeviceName");
    // Whoever is holding the phone leads every game's prefilled player list
    // (TASK-0039). The generic fallback name isn't worth remembering.
    if (typedName) rememberFamilyNames([typedName]);
    setError(null);
    onStartSingleDevice(name);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex justify-end items-start gap-2">
        <LanguageSwitcher />
        <SoundToggle />
      </div>

      {/* Brand header — on the baseplate itself: the hex token mark and a
          white molded title (BDR-0002 §1, §8). */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center gap-3">
          <NexMark size={76} />
          <h1
            className="font-display text-5xl sm:text-6xl text-on-ground"
            style={{ textShadow: "0 5px 0 var(--color-edge-ground)" }}
          >
            NexPlay
          </h1>
        </div>
        <p className="text-lg font-bold text-on-ground">{t("tagline")}</p>
      </div>

      <Card className="space-y-6">
        {/* Mode switch: the chosen mode is a raised yellow key, the other a
            flat socket. */}
        <div className="grid grid-cols-2 gap-2 bg-surface-sunken p-2 rounded-2xl shadow-[inset_0_3px_0_var(--color-edge-sunken)]">
          <Button
            variant="secondary"
            active={mode === "multi-device"}
            onClick={() => {
              setMode("multi-device");
              setError(null);
            }}
            className="text-base px-3 !mb-0"
          >
            {t("multiDeviceButton")}
          </Button>
          <Button
            variant="secondary"
            active={mode === "single-device"}
            onClick={() => {
              setMode("single-device");
              setError(null);
            }}
            className="text-base px-3 !mb-0"
          >
            {t("singleDeviceButton")}
          </Button>
        </div>

        <Field
          label={t("nameLabel")}
          maxLength={15}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("namePlaceholder")}
        />

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 bg-danger-surface rounded-2xl text-base font-bold text-on-danger-surface text-center"
          >
            {error}
          </div>
        )}

        {mode === "multi-device" ? (
          <div className="space-y-5">
            <CodeInput label={t("roomCodeLabel")} value={joinCodeInput} onChange={setJoinCodeInput} />

            <Button variant="primary" onClick={handleJoin} className="text-xl sm:text-2xl">
              {t("joinButton")}
            </Button>

            <div className="flex items-center gap-4 py-1">
              <div className="flex-grow border-t-2 border-line"></div>
              <span className="text-base font-semibold text-ink-muted">{t("orCreateNew")}</span>
              <div className="flex-grow border-t-2 border-line"></div>
            </div>

            <Button variant="secondary" onClick={handleCreate} className="text-xl sm:text-2xl">
              {t("createButton")}
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={handleSingleDevice} className="text-xl sm:text-2xl">
            {t("startSingleDeviceButton")}
          </Button>
        )}
      </Card>
    </div>
  );
}
