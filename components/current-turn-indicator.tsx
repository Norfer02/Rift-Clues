"use client";

import type { PlayerRole, Team } from "@/types/game";
import { useI18n } from "@/lib/i18n";

type CurrentTurnIndicatorProps = {
  activeTeam: Team;
  role?: PlayerRole;
};

function getContainerStyles(team: Team) {
  return team === "blue"
    ? "border-blue-400/35 bg-[linear-gradient(90deg,rgba(37,99,235,0.18),rgba(30,41,59,0.92))] text-blue-50 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
    : "border-red-400/35 bg-[linear-gradient(90deg,rgba(220,38,38,0.18),rgba(30,41,59,0.92))] text-red-50 shadow-[0_12px_28px_rgba(220,38,38,0.12)]";
}

function getAccentStyles(team: Team) {
  return team === "blue"
    ? "bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.8)]"
    : "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.8)]";
}

function getGlowClass(team: Team) {
  return team === "blue" ? "rift-blue-glow" : "rift-red-glow";
}

export function CurrentTurnIndicator({
  activeTeam,
  role,
}: CurrentTurnIndicatorProps) {
  const { t } = useI18n();
  const turnLabel =
    activeTeam === "blue" ? t("turnIndicator.blueTurn") : t("turnIndicator.redTurn");
  const turnHelper =
    role === "spymaster"
      ? t("turnIndicator.sendSignal")
      : role === "operative"
        ? t("turnIndicator.makePicks")
        : t("turnIndicator.playRound");

  return (
    <div
      className={`relative overflow-hidden rounded-[1rem] border px-3 py-2 transition-all duration-300 ease-out sm:px-4 ${getContainerStyles(activeTeam)}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 animate-rift-turn-pulse ${getAccentStyles(activeTeam)}`}
      />
      <div className="flex items-center gap-3 pl-1">
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full animate-rift-turn-pulse ${getAccentStyles(activeTeam)}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`text-sm font-black uppercase tracking-[0.14em] text-white sm:text-[15px] ${getGlowClass(activeTeam)}`}
            >
              {turnLabel}
            </span>
            <span className="hidden text-white/35 sm:inline">-</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 sm:text-xs">
              {turnHelper}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
