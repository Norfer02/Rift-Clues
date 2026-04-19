"use client";

import { useI18n } from "@/lib/i18n";
import type { GameStatus } from "@/types/game";

type GameStatusPanelProps = {
  status: GameStatus;
  remainingBlue: number;
  remainingRed: number;
};

function getTeamAccent(team: "blue" | "red") {
  return team === "blue"
    ? "border-blue-400/40 bg-blue-500/10 text-blue-50"
    : "border-red-400/40 bg-red-500/10 text-red-50";
}

export function GameStatusPanel({
  status,
  remainingBlue,
  remainingRed,
}: GameStatusPanelProps) {
  const { t, tm } = useI18n();
  const activeTeamLabel =
    status.activeTeam === "blue" ? t("common.blueSide") : t("common.redSide");

  return (
    <section className="grid gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-3 shadow-card backdrop-blur lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("common.status")}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${getTeamAccent(status.activeTeam)}`}
          >
            {t("common.activeSide")}: {activeTeamLabel}
          </span>
          {status.gameOver ? (
            <span className="rounded-full border border-rift-gold/50 bg-rift-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rift-gold">
              {t("common.gameOver")}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-[15px]">
          {tm(status.message)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.15rem] border border-blue-400/30 bg-blue-500/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
            {t("common.blueSideRemaining")}
          </p>
          <p className="mt-2 text-2xl font-black text-blue-50 sm:text-3xl">{remainingBlue}</p>
        </div>
        <div className="rounded-[1.15rem] border border-red-400/30 bg-red-500/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200/80">
            {t("common.redSideRemaining")}
          </p>
          <p className="mt-2 text-2xl font-black text-red-50 sm:text-3xl">{remainingRed}</p>
        </div>
      </div>
    </section>
  );
}
