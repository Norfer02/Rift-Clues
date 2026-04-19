"use client";

import type { ViewMode } from "@/types/game";
import { useI18n } from "@/lib/i18n";

type ViewSwitcherProps = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  canUseSpymaster: boolean;
};

export function ViewSwitcher({
  viewMode,
  onChange,
  canUseSpymaster,
}: ViewSwitcherProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2 rounded-[1.15rem] border border-white/10 bg-white/5 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">{t("viewSwitcher.title")}</h2>
        <p className="text-xs text-slate-300 sm:text-sm">
          {canUseSpymaster
            ? t("viewSwitcher.canUseSpymaster")
            : t("viewSwitcher.championOnly")}
        </p>
      </div>

      <div className="inline-flex rounded-full border border-white/10 bg-slate-950/50 p-1">
        <button
          type="button"
          onClick={() => onChange("player")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
            viewMode === "player"
              ? "bg-white text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {t("viewSwitcher.championView")}
        </button>
        <button
          type="button"
          onClick={() => onChange("spymaster")}
          disabled={!canUseSpymaster}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
            viewMode === "spymaster"
              ? "bg-rift-gold text-slate-950"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {t("viewSwitcher.summonerView")}
        </button>
      </div>
    </div>
  );
}
