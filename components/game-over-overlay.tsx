"use client";

import type { GameStatus } from "@/types/game";
import { useI18n } from "@/lib/i18n";

type GameOverOverlayProps = {
  status: GameStatus;
  onPlayAgain: () => void;
};

function getOverlayStyles(status: GameStatus) {
  if (status.endReason === "gank") {
    return "from-black via-slate-950 to-[#220014] text-red-100";
  }

  return status.winner === "blue"
    ? "from-black via-blue-950/95 to-slate-950 text-blue-100"
    : "from-black via-red-950/95 to-slate-950 text-red-100";
}

function getGlowClass(status: GameStatus) {
  if (status.endReason === "gank") {
    return "rift-gank-glow";
  }

  return status.winner === "blue" ? "rift-blue-glow" : "rift-red-glow";
}

export function GameOverOverlay({
  status,
  onPlayAgain,
}: GameOverOverlayProps) {
  const { t, tm } = useI18n();
  const winnerLabel =
    status.winner === "blue"
      ? t("common.blueSide")
      : status.winner === "red"
        ? t("common.redSide")
        : "";
  const loserLabel =
    status.loser === "blue"
      ? t("common.blueSide")
      : status.loser === "red"
        ? t("common.redSide")
        : "";
  const title =
    status.endReason === "gank"
      ? t("gameOver.allySlain")
      : status.winner
        ? t("gameOver.victory")
        : t("gameOver.defeat");
  const subtitle =
    status.endReason === "gank"
      ? status.loser === "blue"
        ? t("gameOver.gankedByRengar")
        : t("gameOver.gankedByKhazix")
      : t("gameOver.wins", { team: winnerLabel });
  const description =
    status.endReason === "gank"
      ? t("gameOver.gankDescription", { team: loserLabel })
      : status.winner === "blue"
        ? t("gameOver.allBlueRevealed")
        : t("gameOver.allRedRevealed");

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-gradient-to-br ${getOverlayStyles(status)} ${status.endReason === "gank" ? "animate-gank-overlay" : "animate-game-over-overlay"} px-6 text-center backdrop-blur-md`}
    >
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${status.endReason === "gank" ? "bg-black/84" : "bg-black/75"}`} />
        {status.endReason === "gank" ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1),transparent_22%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_28%)]" />
            <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.06] blur-[120px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02),transparent_18%),radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_34%)]" />
            <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-[120px]" />
          </>
        )}
      </div>

      <div className={`relative w-full max-w-3xl rounded-[1.5rem] border px-6 py-12 shadow-[0_40px_140px_rgba(0,0,0,0.72)] ring-1 sm:px-10 sm:py-16 ${status.endReason === "gank" ? "border-red-500/20 bg-black/95 ring-red-500/10" : "border-white/10 bg-slate-950/96 ring-white/5"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/55 sm:text-sm">
          {t("gameOver.matchOver")}
        </p>
        <h2
          className={`mt-5 text-4xl font-black uppercase tracking-[0.22em] text-white sm:text-6xl lg:text-7xl ${getGlowClass(status)} ${status.endReason === "gank" ? "animate-game-over-text" : ""}`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 text-base font-semibold tracking-[0.08em] text-white/88 sm:text-xl ${status.endReason === "gank" ? "animate-game-over-text-delayed" : ""}`}
        >
          {subtitle}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
          {description}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
          {tm(status.message)}
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-rift-gold px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-[0_12px_30px_rgba(246,196,83,0.3)] transition hover:scale-[1.01] hover:bg-[#ffd778] sm:text-base"
        >
          {t("gameOver.playAgain")}
        </button>
      </div>
    </div>
  );
}
