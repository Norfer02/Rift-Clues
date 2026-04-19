"use client";

import type { PlayerRole, PlayerSelection, Team } from "@/types/game";
import { useI18n } from "@/lib/i18n";

type SetupScreenProps = {
  selection: Partial<PlayerSelection>;
  onTeamSelect: (team: Team) => void;
  onRoleSelect: (role: PlayerRole) => void;
  onContinue: () => void;
};

function getOptionClasses(active: boolean, accent: "blue" | "red" | "gold") {
  if (!active) {
    return "border-white/10 bg-white/5 text-white hover:border-rift-gold/40 hover:bg-white/10";
  }

  if (accent === "blue") {
    return "border-blue-400/60 bg-blue-500/20 text-blue-50";
  }

  if (accent === "red") {
    return "border-red-400/60 bg-red-500/20 text-red-50";
  }

  return "border-rift-gold/60 bg-rift-gold/15 text-rift-gold";
}

export function SetupScreen({
  selection,
  onTeamSelect,
  onRoleSelect,
  onContinue,
}: SetupScreenProps) {
  const { t } = useI18n();
  const isComplete = Boolean(selection.team && selection.role);

  return (
    <div className="mt-6 flex flex-1 items-center justify-center">
      <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-card backdrop-blur md:p-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rift-gold">
            {t("setup.step2")}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {t("setup.chooseSide")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            {t("setup.description")}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("setup.side")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onTeamSelect("blue")}
                className={`rounded-[1.4rem] border p-5 text-left transition ${getOptionClasses(selection.team === "blue", "blue")}`}
              >
                <p className="text-lg font-bold">{t("common.blueSide")}</p>
                <p className="mt-2 text-sm opacity-80">
                  {t("setup.blueDescription")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onTeamSelect("red")}
                className={`rounded-[1.4rem] border p-5 text-left transition ${getOptionClasses(selection.team === "red", "red")}`}
              >
                <p className="text-lg font-bold">{t("common.redSide")}</p>
                <p className="mt-2 text-sm opacity-80">
                  {t("setup.redDescription")}
                </p>
              </button>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("setup.role")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onRoleSelect("spymaster")}
                className={`rounded-[1.4rem] border p-6 text-left transition ${getOptionClasses(selection.role === "spymaster", "gold")} bg-[linear-gradient(160deg,rgba(246,196,83,0.12),rgba(255,255,255,0.03)_52%,rgba(15,23,42,0.28))] shadow-[0_16px_34px_rgba(2,6,23,0.16)]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rift-gold">
                    Leader
                  </p>
                  <span className="rounded-full border border-rift-gold/25 bg-rift-gold/14 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rift-gold">
                    Summoner
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">{t("common.summoner")}</p>
                <p className="mt-2 text-sm opacity-90">
                  {t("setup.summonerDescription")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onRoleSelect("operative")}
                className={`rounded-[1.4rem] border p-5 text-left transition ${getOptionClasses(selection.role === "operative", "gold")} opacity-95`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Secondary Role
                </p>
                <p className="mt-1.5 text-lg font-bold">{t("gameHeader.champion")}</p>
                <p className="mt-2 text-sm opacity-80">
                  {t("setup.championDescription")}
                </p>
              </button>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            {t("setup.selected")}
            {" "}
            <span className="font-semibold text-white">
              {selection.team
                ? selection.team === "blue"
                  ? t("common.blueSide")
                  : t("common.redSide")
                : t("setup.noSide")}
            </span>
            {" / "}
            <span className="font-semibold text-white">
              {selection.role === "spymaster"
                ? t("setup.summonerLower")
                : selection.role === "operative"
                  ? t("setup.championLower")
                  : t("setup.noRole")}
            </span>
          </p>

          <button
            type="button"
            onClick={onContinue}
            disabled={!isComplete}
            className="inline-flex items-center justify-center rounded-full bg-rift-gold px-6 py-3 font-semibold text-slate-950 transition hover:bg-[#ffd778] disabled:cursor-default disabled:opacity-50"
          >
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
