import type { Team } from "@/types/game";

export type GankCinematicPhase =
  | "black"
  | "image-dark"
  | "eyes"
  | "reveal"
  | "done";

export type GankCinematicVariant = "rengar" | "khazix";

type GankCinematicTimings = {
  black: number;
  imageDark: number;
  eyes: number;
  reveal: number;
  hold: number;
};

type GankCinematicConfig = {
  imageSrc: string;
  variant: GankCinematicVariant;
  timings: GankCinematicTimings;
  totalMs: number;
};

const RENGAR_TIMINGS: GankCinematicTimings = {
  black: 500,
  imageDark: 800,
  eyes: 900,
  reveal: 1200,
  hold: 500,
};

const KHAZIX_TIMINGS: GankCinematicTimings = {
  black: 400,
  imageDark: 600,
  eyes: 800,
  reveal: 900,
  hold: 400,
};

function getTotalMs(timings: GankCinematicTimings) {
  return (
    timings.black +
    timings.imageDark +
    timings.eyes +
    timings.reveal +
    timings.hold
  );
}

export function getGankCinematicConfig(losingTeam: Team): GankCinematicConfig {
  if (losingTeam === "red") {
    return {
      imageSrc: "/cinematics/khazix-gank.png",
      variant: "khazix",
      timings: KHAZIX_TIMINGS,
      totalMs: getTotalMs(KHAZIX_TIMINGS),
    };
  }

  return {
    imageSrc: "/cinematics/rengar-gank.png",
    variant: "rengar",
    timings: RENGAR_TIMINGS,
    totalMs: getTotalMs(RENGAR_TIMINGS),
  };
}
