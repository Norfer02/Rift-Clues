"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getOrCreateLocalPlayerId,
  getStoredDisplayName,
  setStoredDisplayName,
} from "@/lib/local-player";
import { DEFAULT_CHAMPION_AVATAR } from "@/lib/champion-avatars";
import {
  createRoom,
  ensurePlayerInRoom,
  fetchRoomByCode,
  toLobbyError,
} from "@/lib/lobby-supabase";
import { generateRoomCode } from "@/lib/room-code";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { missingSupabaseEnvErrorMessage } from "@/lib/supabase";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function HomeLobbyEntry() {
  const router = useRouter();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    setDisplayName(getStoredDisplayName());
    getOrCreateLocalPlayerId();
  }, []);

  const lobbyErrorMessage = (message: string) => {
    switch (message) {
      case "Unknown error":
        return t("landing.errors.unknown");
      case "Enter a display name first.":
        return t("landing.errors.enterDisplayName");
      case "Display name must be 24 characters or fewer.":
        return t("landing.errors.displayNameTooLong");
      case "Unable to create a room right now.":
        return t("landing.errors.unableCreateRoom");
      case "Enter a room code.":
        return t("landing.errors.enterRoomCode");
      case "Enter a valid 6-character room code.":
        return t("landing.errors.invalidRoomCode");
      case "Room not found.":
        return t("landing.errors.roomNotFound");
      case missingSupabaseEnvErrorMessage:
        return t("landing.errors.supabaseConfigMissing");
      default:
        if (message.toLowerCase().includes("failed to fetch")) {
          return t("landing.errors.networkRequestFailed");
        }

        return message;
    }
  };

  const requireDisplayName = () => {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setErrorMessage(t("landing.errors.enterDisplayName"));
      return null;
    }

    if (trimmedName.length > 24) {
      setErrorMessage(t("landing.errors.displayNameTooLong"));
      return null;
    }

    setStoredDisplayName(trimmedName);
    return trimmedName;
  };

  const handleCreateRoom = async () => {
    const name = requireDisplayName();
    if (!name) {
      return;
    }

    setErrorMessage("");
    setLoadingAction("create");

    try {
      const playerId = getOrCreateLocalPlayerId();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const code = generateRoomCode();
          const room = await createRoom(code, playerId);
          await ensurePlayerInRoom(
            room,
            playerId,
            name,
            DEFAULT_CHAMPION_AVATAR,
            true,
          );
          router.push(`/room/${room.code}`);
          return;
        } catch (error) {
          const message = toErrorMessage(error);
          if (message.toLowerCase().includes("duplicate")) {
            continue;
          }

          throw error;
        }
      }

      setErrorMessage(t("landing.errors.unableCreateRoom"));
    } catch (error) {
      console.error("Create room failed:", error);
      setErrorMessage(lobbyErrorMessage(toErrorMessage(error)));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleJoinRoom = async () => {
    const name = requireDisplayName();
    if (!name) {
      return;
    }

    const roomCode = joinCode.trim().toUpperCase();
    if (!roomCode) {
      setErrorMessage(t("landing.errors.enterRoomCode"));
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
      setErrorMessage(t("landing.errors.invalidRoomCode"));
      return;
    }

    setErrorMessage("");
    setLoadingAction("join");

    try {
      const playerId = getOrCreateLocalPlayerId();
      const room = await fetchRoomByCode(roomCode);

      if (!room) {
        setErrorMessage(t("landing.errors.roomNotFound"));
        return;
      }

      await ensurePlayerInRoom(
        room,
        playerId,
        name,
        DEFAULT_CHAMPION_AVATAR,
        false,
      );
      router.push(`/room/${room.code}`);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Join room failed:", error);
      setErrorMessage(lobbyErrorMessage(normalizedError.message));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(246,196,83,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.12),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.3),rgba(2,6,23,0.82))]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LanguageSwitcher className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" compact />

        <section className="rift-page-enter relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-[0_24px_90px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rift-landing-left relative flex flex-col justify-between border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="rift-landing-ambient absolute inset-0" />

            <div className="rift-landing-hero relative">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-rift-gold [text-shadow:0_0_14px_rgba(246,196,83,0.18),0_0_28px_rgba(246,196,83,0.08)] sm:text-[15px]">
                Rift Clues
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-black leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t("landing.heroTitle")}
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                {t("landing.heroDescription")}
              </p>
            </div>

            <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rift-interactive-surface rift-landing-support-card rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rift-gold/80">
                  {t("landing.multiplayerTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {t("landing.multiplayerDescription")}
                </p>
              </div>
              <div className="rift-interactive-surface rift-landing-support-card rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200/85">
                  {t("landing.teamSetupTitle")}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {t("landing.teamSetupDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center p-6 sm:p-8 lg:p-10">
            <div className="rift-landing-form w-full rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(15,23,42,0.3)] sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                  {t("landing.matchLobby")}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {t("landing.setSummonerName")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t("landing.displayNameDescription")}
                </p>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="display-name"
                  className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300"
                >
                  {t("landing.displayNameLabel")}
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t("landing.displayNamePlaceholder")}
                  className="rift-input mt-2 w-full rounded-2xl border border-white/12 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={loadingAction !== null}
                  className="rift-button rift-button-primary w-full rounded-2xl bg-rift-gold px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-rift-gold/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-default disabled:opacity-70"
                >
                  {loadingAction === "create"
                    ? t("landing.creatingRoom")
                    : t("landing.createRoom")}
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {t("landing.orJoin")}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div>
                <label
                  htmlFor="room-code"
                  className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300"
                >
                  {t("landing.roomCodeLabel")}
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="room-code"
                    type="text"
                    value={joinCode}
                    onChange={(event) =>
                      setJoinCode(
                        event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                      )
                    }
                    maxLength={6}
                    placeholder="ABC123"
                    className="rift-input min-w-0 flex-1 rounded-2xl border border-white/12 bg-slate-950/70 px-4 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white outline-none placeholder:tracking-[0.18em] focus:border-blue-300/45 focus:ring-2 focus:ring-blue-400/20"
                  />
                  <button
                    type="button"
                    onClick={handleJoinRoom}
                    disabled={loadingAction !== null}
                    className="rift-button rift-button-secondary rounded-2xl border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-default disabled:opacity-70"
                  >
                    {loadingAction === "join"
                      ? t("landing.joiningRoom")
                      : t("landing.joinRoom")}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-4 rounded-2xl border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
