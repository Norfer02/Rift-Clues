"use client";

import { useI18n } from "@/lib/i18n";
import type { LobbyPlayer } from "@/types/lobby";
import type { TranslationMessage } from "@/lib/i18n-types";

type SharedMatchEndScreenProps = {
  winner: "blue" | "red" | null;
  loser: "blue" | "red" | null;
  endReason: "victory" | "gank" | null;
  message: TranslationMessage;
  isHost: boolean;
  isStartingRematch: boolean;
  isReturningToLobby: boolean;
  onRematch: () => void;
  onBackToLobby: () => void;
  onLeaveRoom?: () => void;
  leavingRoom?: boolean;
  playerSide?: LobbyPlayer["side"];
};

export function SharedMatchEndScreen({
  winner,
  loser,
  endReason,
  message,
  isHost,
  isStartingRematch,
  isReturningToLobby,
  onRematch,
  onBackToLobby,
  onLeaveRoom,
  leavingRoom = false,
  playerSide,
}: SharedMatchEndScreenProps) {
  const { t, tm } = useI18n();
  const isGankDefeat = endReason === "gank";
  const didCurrentPlayerWin = Boolean(playerSide && winner && playerSide === winner);
  const winnerLabel =
    winner === "blue" ? t("common.blueSide") : winner === "red" ? t("common.redSide") : "";
  const heading = didCurrentPlayerWin ? t("sharedGame.victory") : t("sharedGame.defeat");
  const accentShellClass = didCurrentPlayerWin
    ? "border-blue-300/18 bg-[linear-gradient(160deg,rgba(11,22,43,0.95),rgba(16,31,63,0.92)_52%,rgba(10,14,24,0.98))] shadow-[0_32px_90px_rgba(2,6,23,0.62),0_0_0_1px_rgba(147,197,253,0.08),0_0_80px_rgba(59,130,246,0.12)]"
    : "border-red-400/16 bg-[linear-gradient(160deg,rgba(18,12,17,0.97),rgba(32,10,18,0.94)_50%,rgba(10,10,14,0.99))] shadow-[0_32px_90px_rgba(2,6,23,0.7),0_0_0_1px_rgba(248,113,113,0.08),0_0_90px_rgba(239,68,68,0.1)]";
  const backdropClass = didCurrentPlayerWin
    ? "bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(246,196,83,0.08),transparent_22%),rgba(2,6,23,0.72)]"
    : "bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12),transparent_24%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.1),transparent_24%),rgba(3,2,8,0.8)]";
  const titleGlowClass = didCurrentPlayerWin ? "rift-blue-glow" : "rift-loss-glow";
  const resultLine = isGankDefeat
    ? loser === "blue"
      ? t("sharedGame.rengarClosed")
      : t("sharedGame.khazixStruck")
    : t("sharedGame.claimedRift", { team: winnerLabel });
  const flavorLine = isGankDefeat
    ? didCurrentPlayerWin
      ? t("sharedGame.huntersFoundBlood")
      : loser === "blue"
        ? t("sharedGame.oneShotByRengar")
        : t("sharedGame.khazixIsolated")
    : didCurrentPlayerWin
      ? t("sharedGame.controlledMap")
      : t("sharedGame.fellShort");

  return (
    <div className="fixed inset-0 z-[62] flex items-center justify-center px-4 py-6">
      <div className={`absolute inset-0 backdrop-blur-md ${backdropClass}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%,rgba(2,6,23,0.2)_100%)]" />

      <section
        className={`rift-modal-surface relative w-full max-w-4xl overflow-hidden rounded-[2rem] border ${accentShellClass}`}
      >
        <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-rift-gold/70 to-transparent" />
        <div
          className={`pointer-events-none absolute -top-16 left-1/2 h-40 w-[32rem] -translate-x-1/2 blur-3xl ${
            didCurrentPlayerWin ? "bg-blue-400/16" : "bg-red-500/12"
          }`}
        />
        {isGankDefeat ? (
          <>
            <div className="pointer-events-none absolute -left-12 top-10 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-6 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute -left-12 top-8 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-4 h-64 w-64 rounded-full bg-rift-gold/10 blur-3xl" />
          </>
        )}

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
                {t("sharedGame.matchComplete")}
              </p>
              <h2 className={`mt-4 text-4xl font-black uppercase tracking-[0.18em] text-white sm:text-6xl ${titleGlowClass}`}>
                {heading}
              </h2>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-rift-gold/90 sm:text-base">
                {resultLine}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/88 sm:text-base">
                {flavorLine}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
                {tm(message)}
              </p>
            </div>

            <div className="grid min-w-[15rem] gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 backdrop-blur-md">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t("sharedGame.winningSide")}
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {winnerLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t("sharedGame.finish")}
                </p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white">
                  {isGankDefeat
                    ? t("sharedGame.hunterKill")
                    : t("sharedGame.objectiveComplete")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-300">
              {isHost
                ? t("sharedGame.hostActionPrompt")
                : t("sharedGame.waitingOnHost")}
            </div>

            <div className="flex flex-wrap gap-3">
              {isHost ? (
                <button
                  type="button"
                  onClick={onRematch}
                  disabled={isStartingRematch || isReturningToLobby}
                  className="rift-button rift-button-primary inline-flex items-center justify-center rounded-full bg-rift-gold px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_14px_32px_rgba(246,196,83,0.22)] disabled:cursor-default disabled:opacity-60"
                >
                  {isStartingRematch ? t("common.starting") : t("common.rematch")}
                </button>
              ) : (
                <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-slate-200">
                  {t("sharedGame.hostControlsRematch")}
                </div>
              )}

              <button
                type="button"
                onClick={onBackToLobby}
                disabled={isReturningToLobby || isStartingRematch}
                className="rift-button rift-button-secondary inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60"
              >
                {isReturningToLobby ? t("common.returning") : t("common.backToLobby")}
              </button>

              {onLeaveRoom ? (
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  disabled={leavingRoom || isStartingRematch}
                  className="rift-button rift-button-secondary inline-flex items-center justify-center rounded-full border border-white/10 bg-black/25 px-5 py-3 text-sm font-semibold text-slate-200 disabled:cursor-default disabled:opacity-60"
                >
                  {leavingRoom ? t("common.leaving") : t("common.leaveRoom")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
