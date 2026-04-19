import type {
  GankCinematicPhase,
  GankCinematicVariant,
} from "@/lib/gank-cinematic";

type GankImageCinematicOverlayProps = {
  phase: GankCinematicPhase;
  imageSrc: string;
  variant: GankCinematicVariant;
};

function getRengarImageStyles(phase: GankCinematicPhase) {
  if (phase === "black") {
    return {
      opacity: 0,
      transform: "scale(1)",
      filter: "brightness(0.12) contrast(1)",
    };
  }

  if (phase === "image-dark") {
    return {
      opacity: 0.45,
      transform: "scale(1)",
      filter: "brightness(0.16) contrast(1.08) saturate(0.92)",
    };
  }

  if (phase === "eyes") {
    return {
      opacity: 0.58,
      transform: "scale(1.01)",
      filter: "brightness(0.22) contrast(1.28) saturate(1.05)",
    };
  }

  if (phase === "reveal") {
    return {
      opacity: 0.92,
      transform: "scale(1.05)",
      filter: "brightness(0.5) contrast(1.14) saturate(1.02)",
    };
  }

  return {
    opacity: 0.98,
    transform: "scale(1.05)",
    filter: "brightness(0.56) contrast(1.18) saturate(1.04)",
  };
}

function getKhazixImageStyles(phase: GankCinematicPhase) {
  if (phase === "black") {
    return {
      opacity: 0,
      transform: "scale(1)",
      filter: "brightness(0.08) contrast(1.08) saturate(0.75)",
    };
  }

  if (phase === "image-dark") {
    return {
      opacity: 0.34,
      transform: "scale(1.01)",
      filter: "brightness(0.12) contrast(1.4) saturate(0.78)",
    };
  }

  if (phase === "eyes") {
    return {
      opacity: 0.5,
      transform: "scale(1.02)",
      filter: "brightness(0.2) contrast(1.6) saturate(1.1)",
    };
  }

  if (phase === "reveal") {
    return {
      opacity: 0.94,
      transform: "scale(1.06)",
      filter: "brightness(0.46) contrast(1.3) saturate(1.08)",
    };
  }

  return {
    opacity: 1,
    transform: "scale(1.06)",
    filter: "brightness(0.52) contrast(1.34) saturate(1.1)",
  };
}

function getImageStyles(
  phase: GankCinematicPhase,
  variant: GankCinematicVariant,
) {
  return variant === "khazix"
    ? getKhazixImageStyles(phase)
    : getRengarImageStyles(phase);
}

function getBackdropOpacity(
  phase: GankCinematicPhase,
  variant: GankCinematicVariant,
) {
  if (phase === "black") {
    return 1;
  }

  if (variant === "khazix") {
    if (phase === "image-dark") {
      return 0.82;
    }

    if (phase === "eyes") {
      return 0.66;
    }

    if (phase === "reveal") {
      return 0.32;
    }

    return 0.24;
  }

  if (phase === "image-dark") {
    return 0.72;
  }

  if (phase === "eyes") {
    return 0.56;
  }

  if (phase === "reveal") {
    return 0.34;
  }

  return 0.28;
}

function getFocusOverlay(
  phase: GankCinematicPhase,
  variant: GankCinematicVariant,
) {
  if (variant === "khazix") {
    if (phase === "eyes") {
      return {
        opacity: 0.42,
        background:
          "radial-gradient(circle at 48% 34%, rgba(185, 104, 255, 0.48), transparent 8%), radial-gradient(circle at 53% 34%, rgba(135, 56, 255, 0.42), transparent 8%), radial-gradient(circle at 50% 38%, rgba(97, 30, 204, 0.18), transparent 18%)",
      };
    }

    if (phase === "reveal") {
      return {
        opacity: 0.18,
        background:
          "radial-gradient(circle at 50% 36%, rgba(149, 76, 255, 0.3), transparent 16%), radial-gradient(circle at 50% 42%, rgba(67, 20, 157, 0.16), transparent 28%)",
      };
    }

    if (phase === "done") {
      return {
        opacity: 0.08,
        background:
          "radial-gradient(circle at 50% 36%, rgba(149, 76, 255, 0.24), transparent 18%)",
      };
    }

    return { opacity: 0, background: "none" };
  }

  if (phase === "eyes") {
    return {
      opacity: 0.38,
      background:
        "radial-gradient(circle at 50% 36%, rgba(255, 191, 64, 0.42), transparent 10%), radial-gradient(circle at 50% 40%, rgba(255, 120, 0, 0.18), transparent 22%)",
    };
  }

  if (phase === "reveal") {
    return {
      opacity: 0.16,
      background:
        "radial-gradient(circle at 50% 36%, rgba(255, 191, 64, 0.42), transparent 10%), radial-gradient(circle at 50% 40%, rgba(255, 120, 0, 0.18), transparent 22%)",
    };
  }

  if (phase === "done") {
    return {
      opacity: 0.08,
      background:
        "radial-gradient(circle at 50% 36%, rgba(255, 191, 64, 0.32), transparent 16%)",
    };
  }

  return { opacity: 0, background: "none" };
}

export function GankImageCinematicOverlay({
  phase,
  imageSrc,
  variant,
}: GankImageCinematicOverlayProps) {
  const imageStyles = getImageStyles(phase, variant);
  const focusOverlay = getFocusOverlay(phase, variant);
  const imageTransition =
    phase === "reveal" || phase === "done"
      ? variant === "khazix"
        ? "opacity 520ms ease, transform 900ms cubic-bezier(0.2, 0.82, 0.2, 1), filter 520ms ease"
        : "opacity 700ms ease, transform 1100ms ease-out, filter 700ms ease"
      : variant === "khazix"
        ? "opacity 480ms ease, transform 680ms ease-out, filter 480ms ease"
        : "opacity 600ms ease, transform 800ms ease-out, filter 600ms ease";
  const backdropTransition =
    phase === "black"
      ? variant === "khazix"
        ? "opacity 400ms ease-out"
        : "opacity 500ms ease-out"
      : variant === "khazix"
        ? "opacity 520ms ease-out"
        : "opacity 700ms ease-out";
  const focusTransition = variant === "khazix" ? "opacity 500ms ease-out" : "opacity 700ms ease-out";
  const shimmerVisible = variant === "khazix" && phase === "image-dark";
  const flickerVisible = variant === "khazix" && (phase === "image-dark" || phase === "eyes");

  return (
    <div
      className="fixed inset-0 z-[65] overflow-hidden bg-black"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 ${shimmerVisible ? "animate-khazix-shimmer" : ""}`}
        style={{
          background:
            variant === "khazix"
              ? "linear-gradient(112deg, transparent 18%, rgba(182, 110, 255, 0.08) 34%, rgba(255, 255, 255, 0.04) 42%, transparent 55%)"
              : "none",
          opacity: shimmerVisible ? 0.52 : 0,
          mixBlendMode: "screen",
          transition: "opacity 320ms ease-out",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${imageSrc})`,
          backgroundPosition: "center center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: imageStyles.opacity,
          transform: imageStyles.transform,
          filter: imageStyles.filter,
          transition: imageTransition,
          willChange: "opacity, transform, filter",
        }}
      />
      {variant === "khazix" ? (
        <div
          className={`absolute inset-0 ${flickerVisible ? "animate-khazix-flicker" : ""}`}
          style={{
            opacity: flickerVisible ? 0.16 : 0,
            background:
              "linear-gradient(180deg, rgba(182, 110, 255, 0.1), transparent 30%, rgba(74, 19, 130, 0.12) 72%, transparent 100%)",
            mixBlendMode: "screen",
            transition: "opacity 220ms ease-out",
          }}
        />
      ) : null}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: getBackdropOpacity(phase, variant),
          transition: backdropTransition,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: focusOverlay.opacity,
          transition: focusTransition,
          background: focusOverlay.background,
        }}
      />
    </div>
  );
}
