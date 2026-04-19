"use client";

import { useI18n } from "@/lib/i18n";
import type { ActiveClue, Team } from "@/types/game";
import { OVERLAY_DURATION_MS } from "@/lib/overlay-timing";

type SignalTransitionOverlayProps = {
  team: Team;
  signal: ActiveClue;
};

function getTeamStyles(team: Team) {
  return team === "blue"
    ? "from-blue-950/95 via-blue-900/90 to-slate-950/95 text-blue-100"
    : "from-red-950/95 via-red-900/90 to-slate-950/95 text-red-100";
}

export function SignalTransitionOverlay({
  team,
  signal,
}: SignalTransitionOverlayProps) {
  const { t } = useI18n();
  const teamLabel = team === "blue" ? t("common.blueSide") : t("common.redSide");

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${getTeamStyles(team)} animate-signal-overlay px-6 text-center`}
      style={{ animationDuration: `${OVERLAY_DURATION_MS}ms` }}
    >
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70 sm:text-base">
          {t("overlays.teamSignal", { team: teamLabel })}
        </p>
        <h2
          className="mt-6 text-4xl font-black tracking-tight text-white animate-signal-pop sm:text-6xl"
          style={{ animationDuration: `${OVERLAY_DURATION_MS}ms` }}
        >
          {signal.word} ({signal.number})
        </h2>
      </div>
    </div>
  );
}
