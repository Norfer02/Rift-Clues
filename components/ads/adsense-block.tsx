"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseBlockProps = {
  adSlot?: string;
  className?: string;
  style?: CSSProperties;
};

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

export function AdSenseBlock({
  adSlot,
  className,
  style,
}: AdSenseBlockProps) {
  useEffect(() => {
    if (!adsenseClient || !adSlot || typeof window === "undefined") {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can throw when blocked or not ready yet; fail silently.
    }
  }, [adSlot]);

  if (!adsenseClient || !adSlot) {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`.trim()}
      style={style ?? { display: "block" }}
      data-ad-client={adsenseClient}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
