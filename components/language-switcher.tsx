"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`rift-toggle-shell inline-flex items-center rounded-full border border-white/10 bg-slate-950/65 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-card backdrop-blur ${
        compact ? "p-0.5" : "p-1"
      } ${className}`}
      aria-label={t("common.language")}
    >
      <span
        className={`rift-toggle-indicator ${
          locale === "en"
            ? "left-1 translate-x-0 bg-white"
            : "left-1 translate-x-full bg-rift-gold"
        } ${compact ? "top-[2px] bottom-[2px] w-[calc(50%-4px)]" : ""}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rift-toggle-option rounded-full ${
          compact ? "px-2 py-[0.3rem] text-[9px]" : "px-2.5 py-1"
        } ${
          locale === "en"
            ? "text-slate-950"
            : "text-slate-300"
        }`}
        aria-pressed={locale === "en"}
      >
        {t("common.english")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={`rift-toggle-option rounded-full ${
          compact ? "px-2 py-[0.3rem] text-[9px]" : "px-2.5 py-1"
        } ${
          locale === "fr"
            ? "text-slate-950"
            : "text-slate-300"
        }`}
        aria-pressed={locale === "fr"}
      >
        {t("common.french")}
      </button>
    </div>
  );
}
