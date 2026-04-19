"use client";

import { useEffect, useRef, useState } from "react";
import { CluePanel } from "@/components/clue-panel";
import { CurrentTurnIndicator } from "@/components/current-turn-indicator";
import { GameBoard } from "@/components/game-board";
import { GankImageCinematicOverlay } from "@/components/gank-image-cinematic-overlay";
import { GameHeader } from "@/components/game-header";
import { GameOverOverlay } from "@/components/game-over-overlay";
import { KillStreakOverlay } from "@/components/kill-streak-overlay";
import { SignalTransitionOverlay } from "@/components/signal-transition-overlay";
import { TurnTransitionOverlay } from "@/components/turn-transition-overlay";
import { ViewSwitcher } from "@/components/view-switcher";
import {
  createInitialStatus,
  createNewGame,
  getNextTeam,
  getRemainingCount,
  getRandomStartingTeam,
  revealCard,
} from "@/lib/game";
import {
  getGankCinematicConfig,
  type GankCinematicVariant,
  type GankCinematicPhase,
} from "@/lib/gank-cinematic";
import { OVERLAY_DURATION_MS } from "@/lib/overlay-timing";
import { useI18n } from "@/lib/i18n";
import type {
  ActiveClue,
  GameCard,
  GameStage,
  GameStatus,
  PlayerRole,
  PlayerSelection,
  Team,
  ViewMode,
} from "@/types/game";
import { SetupScreen } from "@/components/setup-screen";

const WRONG_PICK_FEEDBACK_MS = 900;
const WRONG_PICK_FLASH_MS = 420;
const SUCCESS_FEEDBACK_MS = 520;
const SUCCESS_FEEDBACK_DELAY_MS = 320;
function getKillStreakMeta(streak: number) {
  if (streak === 2) {
    return {
      labelKey: "overlays.doubleKill",
      tier: 2 as const,
      durationMs: 1000,
    };
  }

  if (streak === 3) {
    return {
      labelKey: "overlays.tripleKill",
      tier: 3 as const,
      durationMs: 1060,
    };
  }

  if (streak === 4) {
    return {
      labelKey: "overlays.quadraKill",
      tier: 4 as const,
      durationMs: 1120,
    };
  }

  if (streak >= 5) {
    return {
      labelKey: "overlays.pentakill",
      tier: 5 as const,
      durationMs: 1200,
    };
  }

  return null;
}

export function RiftCluesGame() {
  const { locale, t } = useI18n();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [stage, setStage] = useState<GameStage>("landing");
  const [viewMode, setViewMode] = useState<ViewMode>("player");
  const [status, setStatus] = useState<GameStatus>(createInitialStatus);
  const [activeClue, setActiveClue] = useState<ActiveClue | null>(null);
  const [picksRemaining, setPicksRemaining] = useState<number | null>(null);
  const [signalLocked, setSignalLocked] = useState(false);
  const [consecutiveCorrectPicks, setConsecutiveCorrectPicks] = useState(0);
  const [selection, setSelection] = useState<Partial<PlayerSelection> | null>(null);
  const [wrongPickFeedback, setWrongPickFeedback] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: "",
  });
  const [turnTransition, setTurnTransition] = useState<{
    visible: boolean;
    fromTeam: Team;
    toTeam: Team;
  } | null>(null);
  const [signalTransition, setSignalTransition] = useState<{
    visible: boolean;
    team: Team;
    signal: ActiveClue;
  } | null>(null);
  const [gankCinematic, setGankCinematic] = useState<{
    visible: boolean;
    losingTeam: Team;
    phase: GankCinematicPhase;
    variant: GankCinematicVariant;
    imageSrc: string;
  } | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<{
    visible: boolean;
    cardId: string;
  } | null>(null);
  const [killStreakFeedback, setKillStreakFeedback] = useState<{
    label: string;
    team: Team;
    tier: 2 | 3 | 4 | 5;
    durationMs: number;
  } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const killStreakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gankTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const hasGameStarted = stage !== "landing";
  const canUseSpymaster = selection?.role === "spymaster";
  const hasCompleteSelection = Boolean(selection?.team && selection?.role);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      if (signalTimeoutRef.current) {
        clearTimeout(signalTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      if (killStreakTimeoutRef.current) {
        clearTimeout(killStreakTimeoutRef.current);
      }

      gankTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const handleStartGame = () => {
    const startingTeam = getRandomStartingTeam();

    setCards(createNewGame(locale));
    setStage("setup");
    setViewMode("player");
    setStatus(createInitialStatus(startingTeam));
    setActiveClue(null);
    setPicksRemaining(null);
    setSignalLocked(false);
    setConsecutiveCorrectPicks(0);
    setSelection(null);
    setWrongPickFeedback({
      visible: false,
      message: "",
    });
    setTurnTransition(null);
    setSignalTransition(null);
    setGankCinematic(null);
    setSuccessFeedback(null);
    setKillStreakFeedback(null);
  };

  const handleTeamSelect = (team: Team) => {
    setSelection((current) => ({
      team,
      role: current?.role,
    }));
  };

  const handleRoleSelect = (role: PlayerRole) => {
    setSelection((current) => ({
      team: current?.team,
      role,
    }));
  };

  const handleContinueToBoard = () => {
    if (!selection?.team || !selection.role) {
      return;
    }

    setStage("playing");
    setViewMode(selection.role === "spymaster" ? "spymaster" : "player");
  };

  const handleReturnToSetup = () => {
    setStage("setup");
    setViewMode("player");
  };

  const clearTurnSignal = () => {
    setActiveClue(null);
    setPicksRemaining(null);
    setSignalLocked(false);
    setConsecutiveCorrectPicks(0);
  };

  const clearTimers = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    if (signalTimeoutRef.current) {
      clearTimeout(signalTimeoutRef.current);
      signalTimeoutRef.current = null;
    }

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    if (killStreakTimeoutRef.current) {
      clearTimeout(killStreakTimeoutRef.current);
      killStreakTimeoutRef.current = null;
    }

    gankTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    gankTimeoutRefs.current = [];
  };

  const startKillStreakFeedback = (
    label: string,
    team: Team,
    tier: 2 | 3 | 4 | 5,
    durationMs: number,
  ) => {
    if (killStreakTimeoutRef.current) {
      clearTimeout(killStreakTimeoutRef.current);
      killStreakTimeoutRef.current = null;
    }

    setKillStreakFeedback({
      label,
      team,
      tier,
      durationMs,
    });

    killStreakTimeoutRef.current = setTimeout(() => {
      setKillStreakFeedback(null);
      killStreakTimeoutRef.current = null;
    }, durationMs);
  };

  const startSuccessFeedback = (cardId: string, onComplete: () => void) => {
    clearTimers();
    setSuccessFeedback({
      visible: true,
      cardId,
    });

    successTimeoutRef.current = setTimeout(() => {
      setSuccessFeedback(null);
      successTimeoutRef.current = setTimeout(() => {
        successTimeoutRef.current = null;
        onComplete();
      }, SUCCESS_FEEDBACK_DELAY_MS);
    }, SUCCESS_FEEDBACK_MS);
  };

  const startGankCinematic = (losingTeam: Team) => {
    const config = getGankCinematicConfig(losingTeam);

    clearTimers();
    setGankCinematic({
      visible: true,
      losingTeam,
      phase: "black",
      variant: config.variant,
      imageSrc: config.imageSrc,
    });

    const imageDarkTimeout = setTimeout(() => {
      setGankCinematic((current) =>
        current ? { ...current, phase: "image-dark" } : current,
      );
    }, config.timings.black);

    const eyesTimeout = setTimeout(() => {
      setGankCinematic((current) =>
        current ? { ...current, phase: "eyes" } : current,
      );
    }, config.timings.black + config.timings.imageDark);

    const revealTimeout = setTimeout(() => {
      setGankCinematic((current) =>
        current ? { ...current, phase: "reveal" } : current,
      );
    }, config.timings.black + config.timings.imageDark + config.timings.eyes);

    const doneTimeout = setTimeout(() => {
      setGankCinematic((current) =>
        current ? { ...current, phase: "done" } : current,
      );
    }, config.timings.black + config.timings.imageDark + config.timings.eyes + config.timings.reveal);

    const clearTimeoutId = setTimeout(() => {
      setGankCinematic(null);
      gankTimeoutRefs.current = [];
    }, config.totalMs);

    gankTimeoutRefs.current = [
      imageDarkTimeout,
      eyesTimeout,
      revealTimeout,
      doneTimeout,
      clearTimeoutId,
    ];
  };

  const startTurnTransition = (fromTeam: Team, toTeam: Team) => {
    clearTimers();
    setTurnTransition({
      visible: true,
      fromTeam,
      toTeam,
    });

    transitionTimeoutRef.current = setTimeout(() => {
      setTurnTransition(null);
      transitionTimeoutRef.current = null;
    }, OVERLAY_DURATION_MS);
  };

  const startWrongPickFeedback = (
    message: string,
    fromTeam: Team,
    toTeam: Team,
  ) => {
    clearTimers();
    setWrongPickFeedback({
      visible: true,
      message,
    });

    feedbackTimeoutRef.current = setTimeout(() => {
      setWrongPickFeedback({
        visible: false,
        message: "",
      });
      feedbackTimeoutRef.current = null;
      startTurnTransition(fromTeam, toTeam);
    }, WRONG_PICK_FEEDBACK_MS);
  };

  const handleSubmitClue = (clue: ActiveClue) => {
    if (
      status.gameOver ||
      !canUseSpymaster ||
      signalTransition?.visible ||
      signalLocked
    ) {
      return;
    }

    clearTimers();
    setSignalLocked(true);
    setSignalTransition({
      visible: true,
      team: status.activeTeam,
      signal: clue,
    });

    signalTimeoutRef.current = setTimeout(() => {
      setActiveClue(clue);
      setPicksRemaining(clue.number + 1);
      setSignalTransition(null);
      signalTimeoutRef.current = null;
    }, OVERLAY_DURATION_MS);
  };

  const handleEndRound = () => {
    if (
      status.gameOver ||
      viewMode !== "player" ||
      !signalActive ||
      Boolean(turnTransition?.visible) ||
      Boolean(signalTransition?.visible)
    ) {
      return;
    }

    const activeTeam = status.activeTeam;
    const opposingTeam = getNextTeam(activeTeam);

    setStatus({
      activeTeam: opposingTeam,
      winner: null,
      loser: null,
      gameOver: false,
      endReason: null,
      message: {
        key: "messages.endedRound",
        values: {
          team: activeTeam === "blue" ? "common.blueSide" : "common.redSide",
          nextTeam:
            opposingTeam === "blue" ? "common.blueSide" : "common.redSide",
        },
      },
    });
    clearTurnSignal();
    startTurnTransition(activeTeam, opposingTeam);
  };

  const handleReveal = (cardId: string) => {
    if (
      viewMode === "spymaster" ||
      status.gameOver ||
      Boolean(turnTransition?.visible) ||
      Boolean(signalTransition?.visible)
    ) {
      return;
    }

    const targetCard = cards.find((card) => card.id === cardId);
    if (!targetCard || targetCard.revealed) {
      return;
    }

    const updatedCards = revealCard(cards, cardId);
    const activeTeam = status.activeTeam;
    const opposingTeam: Team = getNextTeam(activeTeam);
    const remainingBlue = getRemainingCount(updatedCards, "blue");
    const remainingRed = getRemainingCount(updatedCards, "red");
    const nextPicksRemaining =
      picksRemaining !== null ? Math.max(picksRemaining - 1, 0) : null;
    const nextCorrectStreak =
      targetCard.role === activeTeam ? consecutiveCorrectPicks + 1 : 0;

    let nextStatus: GameStatus;

    if (targetCard.role === "assassin") {
      nextStatus = {
        activeTeam,
        winner: opposingTeam,
        loser: activeTeam,
        gameOver: true,
        endReason: "gank",
        message: {
          key: "messages.localGotGanked",
          values: {
            team: activeTeam === "blue" ? "common.blueSide" : "common.redSide",
            nextTeam:
              opposingTeam === "blue" ? "common.blueSide" : "common.redSide",
          },
        },
      };
    } else if (remainingBlue === 0) {
      nextStatus = {
        activeTeam,
        winner: "blue",
        loser: "red",
        gameOver: true,
        endReason: "victory",
        message: { key: "messages.localBlueWins" },
      };
    } else if (remainingRed === 0) {
      nextStatus = {
        activeTeam,
        winner: "red",
        loser: "blue",
        gameOver: true,
        endReason: "victory",
        message: { key: "messages.localRedWins" },
      };
    } else if (targetCard.role === activeTeam && nextPicksRemaining === 0) {
      nextStatus = {
        activeTeam: opposingTeam,
        winner: null,
        loser: null,
        gameOver: false,
        endReason: null,
        message: {
          key: "messages.finalPickPass",
          values: {
            team: activeTeam === "blue" ? "common.blueSide" : "common.redSide",
            nextTeam:
              opposingTeam === "blue" ? "common.blueSide" : "common.redSide",
          },
        },
      };
    } else if (targetCard.role === activeTeam) {
      nextStatus = {
        activeTeam,
        winner: null,
        loser: null,
        gameOver: false,
        endReason: null,
        message: {
          key: "messages.matchingCardKeepsTurn",
          values: {
            team: activeTeam === "blue" ? "common.blueSide" : "common.redSide",
          },
        },
      };
    } else if (targetCard.role === "neutral") {
      nextStatus = {
        activeTeam: opposingTeam,
        winner: null,
        loser: null,
        gameOver: false,
        endReason: null,
        message: {
          key: "messages.localNeutralReveal",
          values: {
            nextTeam:
              opposingTeam === "blue" ? "common.blueSide" : "common.redSide",
          },
        },
      };
    } else {
      nextStatus = {
        activeTeam: opposingTeam,
        winner: null,
        loser: null,
        gameOver: false,
        endReason: null,
        message: {
          key: "messages.uncoveredCardPass",
          values: {
            team: activeTeam === "blue" ? "common.blueSide" : "common.redSide",
            cardRole: `roles.${targetCard.role}`,
            nextTeam:
              opposingTeam === "blue" ? "common.blueSide" : "common.redSide",
          },
        },
      };
    }

    setCards(updatedCards);
    setConsecutiveCorrectPicks(nextCorrectStreak);

    const killStreakMeta = getKillStreakMeta(nextCorrectStreak);
    if (killStreakMeta) {
      startKillStreakFeedback(
        t(killStreakMeta.labelKey),
        activeTeam,
        killStreakMeta.tier,
        killStreakMeta.durationMs,
      );
    }

    const applyNextStatus = () => {
      setStatus(nextStatus);
      setPicksRemaining(
        nextStatus.activeTeam === activeTeam && !nextStatus.gameOver
          ? nextPicksRemaining
          : null,
      );

      if (nextStatus.gameOver || nextStatus.activeTeam !== activeTeam) {
        clearTurnSignal();
      }

      if (nextStatus.gameOver && nextStatus.endReason === "gank") {
        startGankCinematic(activeTeam);
        return;
      }

      if (!nextStatus.gameOver && nextStatus.activeTeam !== activeTeam) {
        if (targetCard.role === "neutral") {
          startWrongPickFeedback(t("game.wrongPick"), activeTeam, nextStatus.activeTeam);
        } else if (targetCard.role !== activeTeam) {
          startWrongPickFeedback(t("game.notYourSide"), activeTeam, nextStatus.activeTeam);
        } else {
          startTurnTransition(activeTeam, nextStatus.activeTeam);
        }
      }
    };

    const shouldShowSuccessFeedback =
      targetCard.role === activeTeam &&
      (nextStatus.gameOver || nextStatus.activeTeam !== activeTeam);

    if (shouldShowSuccessFeedback) {
      startSuccessFeedback(cardId, applyNextStatus);
      return;
    }

    applyNextStatus();
  };
  const remainingBlue = getRemainingCount(cards, "blue");
  const remainingRed = getRemainingCount(cards, "red");
  const signalActive = activeClue !== null && picksRemaining !== null;
  const waitingForSignal =
    stage === "playing" &&
    !status.gameOver &&
    !Boolean(signalTransition?.visible) &&
    !signalActive;
  const boardLocked =
    status.gameOver ||
    wrongPickFeedback.visible ||
    Boolean(turnTransition?.visible) ||
    Boolean(signalTransition?.visible) ||
    Boolean(successFeedback?.visible) ||
    Boolean(gankCinematic?.visible) ||
    waitingForSignal;

  return (
    <section className="mx-auto flex h-screen w-full max-w-7xl flex-col overflow-hidden px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6">
      <GameHeader
        hasGameStarted={hasGameStarted}
        onStartGame={handleStartGame}
        onResetGame={handleStartGame}
        selection={hasCompleteSelection ? selection : null}
        status={stage === "playing" ? status : undefined}
        activeClue={stage === "playing" ? activeClue : undefined}
        picksRemaining={stage === "playing" ? picksRemaining : undefined}
        onChangeSetup={stage === "playing" ? handleReturnToSetup : undefined}
      />

      {stage === "playing" ? (
        <div
          className={`relative mt-1 flex min-h-0 flex-1 flex-col gap-2 ${
            wrongPickFeedback.visible ? "animate-rift-wrong-pick-shake" : ""
          }`}
        >
          <ViewSwitcher
            viewMode={viewMode}
            onChange={(mode) => {
              if (!canUseSpymaster && mode === "spymaster") {
                return;
              }
              setViewMode(mode);
            }}
            canUseSpymaster={Boolean(canUseSpymaster)}
          />
          <CluePanel
            activeClue={activeClue}
            picksRemaining={picksRemaining}
            activeTeam={status.activeTeam}
            viewMode={viewMode}
            onSubmitClue={handleSubmitClue}
            showForm={Boolean(canUseSpymaster)}
            signalLocked={signalLocked}
            disabled={status.gameOver || Boolean(signalTransition?.visible)}
            isSubmitting={Boolean(signalTransition?.visible)}
          />
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <CurrentTurnIndicator
                activeTeam={status.activeTeam}
                role={selection?.role}
              />
            </div>
            {viewMode === "player" && signalActive && !status.gameOver ? (
              <button
                type="button"
                onClick={handleEndRound}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:text-sm"
              >
                {t("common.endRound")}
              </button>
            ) : null}
          </div>
          {waitingForSignal ? (
            <div className="rounded-[0.9rem] border border-rift-gold/20 bg-rift-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rift-gold sm:text-sm">
              {t("game.waitingForSummonerSignal")}
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <GameBoard
              cards={cards}
              viewMode={viewMode}
              onReveal={handleReveal}
              locked={boardLocked}
              waitingForSignal={waitingForSignal}
              successHighlightCardId={successFeedback?.cardId}
            />
          </div>
          {killStreakFeedback ? (
            <KillStreakOverlay
              label={killStreakFeedback.label}
              team={killStreakFeedback.team}
              tier={killStreakFeedback.tier}
              durationMs={killStreakFeedback.durationMs}
            />
          ) : null}
          {wrongPickFeedback.visible ? (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden rounded-[1.5rem]">
                <div
                  className="absolute inset-0 animate-wrong-pick-flash bg-red-500/30"
                  style={{ animationDuration: `${WRONG_PICK_FLASH_MS}ms` }}
                />
              <div className="relative rounded-full border border-red-300/40 bg-red-950/75 px-5 py-3 text-sm font-bold uppercase tracking-[0.22em] text-red-100 shadow-card sm:text-base">
                {wrongPickFeedback.message}
              </div>
            </div>
          ) : null}
        </div>
      ) : stage === "setup" ? (
        <SetupScreen
          selection={selection ?? {}}
          onTeamSelect={handleTeamSelect}
          onRoleSelect={handleRoleSelect}
          onContinue={handleContinueToBoard}
        />
      ) : (
        <div className="mt-6 flex flex-1 items-center justify-center">
          <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-card backdrop-blur md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rift-gold">
              {t("landing.step1")}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Rift Clues
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
              {t("landing.description")}
            </p>
            <button
              type="button"
              onClick={handleStartGame}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-rift-gold px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-[#ffd778] focus:outline-none focus:ring-2 focus:ring-rift-gold focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {t("landing.startNewGame")}
            </button>
          </div>
        </div>
      )}
      {turnTransition?.visible ? (
        <TurnTransitionOverlay
          fromTeam={turnTransition.fromTeam}
          toTeam={turnTransition.toTeam}
        />
      ) : null}
      {signalTransition?.visible ? (
        <SignalTransitionOverlay
          team={signalTransition.team}
          signal={signalTransition.signal}
        />
      ) : null}
      {gankCinematic?.visible ? (
        <GankImageCinematicOverlay
          phase={gankCinematic.phase}
          imageSrc={gankCinematic.imageSrc}
          variant={gankCinematic.variant}
        />
      ) : null}
      {status.gameOver && !gankCinematic?.visible ? (
        <GameOverOverlay
          status={status}
          onPlayAgain={handleStartGame}
        />
      ) : null}
    </section>
  );
}
