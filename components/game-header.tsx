"use client";

import type { ActiveClue, GameStatus, PlayerSelection } from "@/types/game";
import { RiftCluesLogo } from "@/components/rift-clues-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

type GameHeaderProps = {
  hasGameStarted: boolean;
  onStartGame: () => void;
  onResetGame: () => void;
  selection: Partial<PlayerSelection> | null;
  status?: GameStatus;
  activeClue?: ActiveClue | null;
  picksRemaining?: number | null;
  onChangeSetup?: () => void;
};

export function GameHeader({
  hasGameStarted,
  onStartGame,
  onResetGame,
  selection,
  status,
  activeClue,
  picksRemaining,
  onChangeSetup,
}: GameHeaderProps) {
  const { t } = useI18n();
  const activeSide =
    status?.activeTeam === "blue"
      ? t("common.blueSide")
      : status?.activeTeam === "red"
        ? t("common.redSide")
        : null;
  const picksBadgeClass =
    status?.activeTeam === "blue"
      ? "border border-blue-400/40 bg-blue-500/15 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.16)]"
      : status?.activeTeam === "red"
        ? "border border-red-400/40 bg-red-500/15 text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.16)]"
        : "border border-white/10 bg-slate-950/40 text-white";
  const signalLabel = activeClue
    ? `${activeClue.word} (${activeClue.number})`
    : t("gameHeader.none");

  return (
    <header className="shrink-0 flex flex-col gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-1 shadow-card backdrop-blur sm:px-4 sm:py-1.5">
      <RiftCluesLogo compact />

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 sm:text-xs">
        <LanguageSwitcher className="mr-1" />
        {hasGameStarted && activeSide ? (
          <div className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 font-semibold text-white">
            {activeSide}
          </div>
        ) : null}
        {hasGameStarted ? (
          <div className="rounded-full border border-rift-gold/20 bg-rift-gold/10 px-2.5 py-1 font-semibold text-rift-gold">
            {t("common.signal")}: {signalLabel}
          </div>
        ) : null}
        {hasGameStarted ? (
          <div className={`rounded-full px-2.5 py-1 font-semibold ${picksBadgeClass}`}>
            {t("common.picks")}: {picksRemaining ?? 0}
          </div>
        ) : null}
        {selection ? (
          <div className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 font-semibold text-slate-200">
            {selection.role === "spymaster"
              ? t("common.summoner")
              : selection.role === "operative"
                ? t("gameHeader.champion")
                : ""}
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {hasGameStarted && onChangeSetup ? (
            <button
              type="button"
              onClick={onChangeSetup}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-white transition hover:bg-white/10"
            >
              {t("common.loadout")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={hasGameStarted ? onResetGame : onStartGame}
            className="inline-flex items-center justify-center rounded-full bg-rift-gold px-3 py-1.5 font-semibold text-slate-950 transition hover:bg-[#ffd778] focus:outline-none focus:ring-2 focus:ring-rift-gold focus:ring-offset-1 focus:ring-offset-slate-900"
          >
            {hasGameStarted ? t("common.reset") : t("common.start")}
          </button>
        </div>
      </div>
    </header>
  );
}
