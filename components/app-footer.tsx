"use client";

import { useI18n } from "@/lib/i18n";

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="pointer-events-none fixed bottom-1 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-4 text-center text-[10px] text-slate-400/60 sm:text-xs">
      {t("footer.disclaimer")}
    </footer>
  );
}
