"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { generateRoomCode, isValidRoomCode } from "@/lib/realtime";
import { rememberFamilyNames } from "@/lib/family/roster";
import { Button, CodeInput, Field, LanguageSwitcher } from "@/components/ui";

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
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative w-full overflow-hidden p-6 sm:p-8 bg-surface-raised text-ink rounded-3xl border-4 border-line shadow-[0_16px_40px_rgba(43,33,24,0.18)] space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Brand Header — the real Nex hexagon mark (BDR-0001 §4,
            TASK-0030), the same file wired as the app's favicon/PWA icon. */}
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/icon.png"
              alt=""
              width={80}
              height={80}
              priority
              aria-hidden="true"
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            <h1 className="font-display text-5xl sm:text-6xl tracking-tight">NexPlay</h1>
          </div>
          <p className="text-sm sm:text-base font-semibold text-ink-muted pt-2">
            {t("tagline")}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 bg-surface-sunken p-2 rounded-2xl border-3 border-line">
          <Button
            variant="primary"
            active={mode === "multi-device"}
            onClick={() => {
              setMode("multi-device");
              setError(null);
            }}
            className="text-sm sm:text-base px-3 leading-tight"
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
            className="text-sm sm:text-base px-3 leading-tight"
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
            className="p-4 bg-danger-surface border-3 border-action-danger rounded-2xl text-sm font-bold text-on-danger-surface text-center"
          >
            {error}
          </div>
        )}

        {mode === "multi-device" ? (
          <div className="space-y-6 pt-2">
            <CodeInput label={t("roomCodeLabel")} value={joinCodeInput} onChange={setJoinCodeInput} />

            <Button variant="primary" onClick={handleJoin} className="text-xl sm:text-2xl">
              {t("joinButton")}
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t-2 border-line"></div>
              <span className="flex-shrink mx-4 text-sm font-semibold text-ink-muted">
                {t("orCreateNew")}
              </span>
              <div className="flex-grow border-t-2 border-line"></div>
            </div>

            <Button variant="secondary" onClick={handleCreate} className="text-xl sm:text-2xl">
              {t("createButton")}
            </Button>
          </div>
        ) : (
          <div className="pt-4">
            <Button variant="secondary" onClick={handleSingleDevice} className="text-xl sm:text-2xl">
              {t("startSingleDeviceButton")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
