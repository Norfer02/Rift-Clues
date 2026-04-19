import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";
import type { CardRole, GameCard, ViewMode } from "@/types/game";

type GameCardTileProps = {
  card: GameCard;
  viewMode: ViewMode;
  locked: boolean;
  waitingForSignal?: boolean;
  successHighlight?: boolean;
  onReveal: () => void;
};

const roleClasses: Record<CardRole, string> = {
  blue: "border-blue-400/60 bg-blue-500/20 text-blue-50",
  red: "border-red-400/60 bg-red-500/20 text-red-50",
  neutral: "border-slate-400/40 bg-slate-500/20 text-slate-100",
  assassin: "border-slate-950 bg-slate-950 text-white",
};

const revealGlowClasses: Record<CardRole, string> = {
  blue: "rift-card-glow-blue",
  red: "rift-card-glow-red",
  neutral: "rift-card-glow-neutral",
  assassin: "rift-card-glow-gank",
};

const pillClasses: Record<CardRole, string> = {
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  neutral: "bg-slate-500 text-white",
  assassin: "bg-black text-white",
};

const minionScaleByAsset: Record<string, number> = {
  "cannon_blue.png": 0.6,
  "cannon_red.png": 0.8625,
  "super_blue.webp": 0.9075,
  "super_red.webp": 0.825,
  "super_red2.png": 0.94875,
  "mage_blue.png": 1.02,
  "mage_red.png": 0.8075,
  "melee_blue2.png": 0.765,
  "melee_blue.png": 0.85,
  "red_melee.webp": 0.9,
};

const minionOffsetYByAsset: Record<string, string> = {
  "melee_blue.png": "20px",
};

function getMinionArtworkStyle(
  revealedImage?: string | null,
): CSSProperties | undefined {
  if (!revealedImage) {
    return undefined;
  }

  const assetName = revealedImage.split("/").pop();
  const scale = assetName ? minionScaleByAsset[assetName] ?? 1 : 1;
  const offsetY = assetName ? minionOffsetYByAsset[assetName] ?? "25px" : "25px";

  return {
    "--minion-scale": scale,
    "--minion-offset-y": offsetY,
  } as CSSProperties;
}

function resolveCardRole(role: GameCard["role"]): CardRole {
  if (
    role === "blue" ||
    role === "red" ||
    role === "neutral" ||
    role === "assassin"
  ) {
    return role;
  }

  return "neutral";
}

function getCardClasses(
  role: CardRole,
  card: GameCard,
  viewMode: ViewMode,
  isInteractive: boolean,
) {
  if (card.revealed || viewMode === "spymaster") {
    return `${roleClasses[role]} ${revealGlowClasses[role]}`;
  }

  if (!isInteractive) {
    return "border-white/10 bg-slate-100 text-slate-950";
  }

  return "border-white/10 bg-slate-100 text-slate-950 hover:-translate-y-0.5 hover:scale-[1.018] hover:border-rift-gold/55 hover:bg-white hover:brightness-[1.02] hover:shadow-[0_14px_28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(246,196,83,0.09),0_0_22px_rgba(246,196,83,0.08)]";
}

export function GameCardTile({
  card,
  viewMode,
  locked,
  waitingForSignal = false,
  successHighlight = false,
  onReveal,
}: GameCardTileProps) {
  const { t } = useI18n();
  const [pressed, setPressed] = useState(false);
  const [revealedPulse, setRevealedPulse] = useState(false);
  const [showRevealedWord, setShowRevealedWord] = useState(false);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRevealedRef = useRef(card.revealed);
  const showRole = viewMode === "spymaster" || card.revealed;
  const canToggleRevealedWord = card.revealed;
  const canRevealCard = !card.revealed && !locked && viewMode !== "spymaster";
  const isInteractive = canRevealCard || canToggleRevealedWord;
  const isDisabled = !isInteractive;
  const resolvedRole = resolveCardRole(card.role);
  const mutedWhileWaiting =
    waitingForSignal && !card.revealed && viewMode !== "spymaster";
  const minionArtworkStyle = getMinionArtworkStyle(card.revealedImage);
  const roleLabels: Record<CardRole, string> = {
    blue: t("roles.blue"),
    red: t("roles.red"),
    neutral: t("roles.neutral"),
    assassin: t("roles.gank"),
  };
  const footerLabel =
    showRole && resolvedRole === "assassin"
      ? t("common.gankInstantLoss")
      : card.revealed
        ? showRevealedWord
          ? t("common.tapToHideWord")
          : t("common.tapToViewWord")
        : viewMode === "spymaster"
          ? null
          : locked
            ? waitingForSignal
              ? t("common.waitingForSummonerSignal")
              : t("common.matchFinished")
            : t("common.tapToPick");

  useEffect(() => {
    if (!previousRevealedRef.current && card.revealed) {
      setRevealedPulse(true);

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }

      revealTimeoutRef.current = setTimeout(() => {
        setRevealedPulse(false);
        revealTimeoutRef.current = null;
      }, 320);
    }

    previousRevealedRef.current = card.revealed;
  }, [card.revealed]);

  useEffect(() => {
    if (!card.revealed) {
      setShowRevealedWord(false);
    }
  }, [card.id, card.revealed]);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const triggerPressFeedback = () => {
    if (isDisabled) {
      return;
    }

    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }

    setPressed(true);
    pressTimeoutRef.current = setTimeout(() => {
      setPressed(false);
      pressTimeoutRef.current = null;
    }, 220);
  };

  const handleCardClick = () => {
    if (card.revealed) {
      setShowRevealedWord((current) => !current);
      return;
    }

    if (canRevealCard) {
      onReveal();
    }
  };

  return (
    <button
      type="button"
      onPointerDown={triggerPressFeedback}
      onClick={handleCardClick}
      disabled={isDisabled}
      className={`group rift-card-shell relative flex h-full min-h-0 min-w-0 flex-col justify-between ${
        card.revealed ? "overflow-visible" : "overflow-hidden"
      } rounded-[0.9rem] border p-1.5 text-left shadow-card transition-[transform,background-color,border-color,color,filter,box-shadow] duration-200 ease-out will-change-transform sm:rounded-[1rem] sm:p-2 lg:rounded-[1.15rem] lg:p-2.5 ${
        getCardClasses(resolvedRole, card, viewMode, isInteractive)
      } ${
        isDisabled ? "cursor-default" : "cursor-pointer"
      } ${
        mutedWhileWaiting ? "opacity-60 saturate-50" : ""
      } ${
        card.revealed && canToggleRevealedWord ? "rift-card-revealed-clickable" : ""
      } ${
        pressed ? "animate-rift-card-press" : ""
      } ${
        revealedPulse ? "animate-rift-card-reveal" : ""
      } ${
        successHighlight ? "animate-rift-card-success" : ""
      } disabled:opacity-100`}
      aria-pressed={card.revealed}
    >
    <span
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${
        card.revealed
          ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%)]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_42%)]"
      }`}
      aria-hidden="true"
    />
    {card.revealed ? (
      <div className="revealed-face">
        {card.revealed && card.revealedImage ? (
          <div className="revealed-image-frame">
            <img
              src={card.revealedImage}
              alt={card.word}
              className={`revealed-image ${
                showRevealedWord ? "revealed-image-muted" : ""
              }`}
              style={minionArtworkStyle}
            />
          </div>
        ) : null}

        <div className="revealed-overlay">
          <div className="revealed-overlay-top flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
            <span className="min-w-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-white opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-[9px] md:text-[10px] lg:text-[11px]">
              {t("common.revealed")}
            </span>
            {showRole ? (
              <span
                className={`shrink-0 rounded-full px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] sm:px-1.5 sm:text-[9px] md:px-2 md:py-1 md:text-[10px] ${pillClasses[resolvedRole]}`}
              >
                {roleLabels[resolvedRole]}
              </span>
            ) : null}
          </div>

          {showRevealedWord ? (
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-1 py-1 text-center sm:px-2">
              <span className="rift-page-enter-soft rounded-[0.8rem] border border-white/15 bg-slate-950/72 px-2.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_10px_24px_rgba(2,6,23,0.34)] backdrop-blur-sm sm:text-xs md:text-sm lg:text-base">
                {card.word}
              </span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="revealed-overlay-bottom">
            {footerLabel ? (
              <span className="line-clamp-2 text-[8px] text-white opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-[9px] md:text-[10px] lg:text-[11px]">
                {footerLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    ) : (
        <>
          <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
            <span className="min-w-0 text-[8px] font-semibold uppercase tracking-[0.14em] opacity-70 sm:text-[9px] md:text-[10px] lg:text-[11px]">
              {card.revealed ? t("common.revealed") : t("common.hidden")}
            </span>
            {showRole ? (
              <span
                className={`shrink-0 rounded-full px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] sm:px-1.5 sm:text-[9px] md:px-2 md:py-1 md:text-[10px] ${pillClasses[resolvedRole]}`}
              >
                {roleLabels[resolvedRole]}
              </span>
            ) : null}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center py-0.5 text-center sm:py-1">
            <span className="line-clamp-3 break-words text-[11px] font-extrabold uppercase tracking-[0.02em] sm:text-xs md:text-sm lg:text-base">
              {card.word}
            </span>
          </div>

          {footerLabel ? (
            <span className="line-clamp-2 text-[8px] opacity-70 sm:text-[9px] md:text-[10px] lg:text-[11px]">
              {footerLabel}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
}
