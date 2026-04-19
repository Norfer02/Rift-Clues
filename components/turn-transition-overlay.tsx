"use client";

import { useI18n } from "@/lib/i18n";
import type { Team } from "@/types/game";
import { OVERLAY_DURATION_MS } from "@/lib/overlay-timing";

type TurnTransitionOverlayProps = {
  fromTeam: Team;
  toTeam: Team;
};

function getTeamStyles(team: Team) {
  return team === "blue"
    ? "from-blue-950/95 via-blue-900/90 to-slate-950/95 text-blue-100"
    : "from-red-950/95 via-red-900/90 to-slate-950/95 text-red-100";
}

export function TurnTransitionOverlay({
  fromTeam,
  toTeam,
}: TurnTransitionOverlayProps) {
  const { t } = useI18n();
  const fromLabel = fromTeam === "blue" ? t("common.blueSide") : t("common.redSide");
  const toLabel = toTeam === "blue" ? t("common.blueSide") : t("common.redSide");

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${getTeamStyles(toTeam)} animate-turn-overlay px-6 text-center`}
      style={{ animationDuration: `${OVERLAY_DURATION_MS}ms` }}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70 sm:text-base">
          {t("overlays.turnTransition")}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
          {t("overlays.turnOver", { team: fromLabel })}
        </h2>
        <p className="mt-4 text-lg font-semibold text-white/80 sm:text-xl">
          {t("overlays.nextTurn", { team: toLabel })}
        </p>
      </div>
    </div>
  );
}
