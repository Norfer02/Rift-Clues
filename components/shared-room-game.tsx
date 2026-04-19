"use client";

import { useEffect, useRef, useState } from "react";
import { CluePanel } from "@/components/clue-panel";
import { GameBoard } from "@/components/game-board";
import { GankImageCinematicOverlay } from "@/components/gank-image-cinematic-overlay";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RiftCluesLogo } from "@/components/rift-clues-logo";
import { SharedMatchEndScreen } from "@/components/shared-match-end-screen";
import { getDefaultAvatarForRole } from "@/lib/champion-avatars";
import {
  revealSharedGameCard,
  submitSharedSignal,
} from "@/lib/game";
import { useI18n } from "@/lib/i18n";
import {
  getGankCinematicConfig,
  type GankCinematicPhase,
  type GankCinematicVariant,
} from "@/lib/gank-cinematic";
import {
  startSharedRoomGame,
  returnRoomToLobby,
  toLobbyError,
  updateRoomGameState,
} from "@/lib/lobby-supabase";
import type { ViewMode } from "@/types/game";
import type { LobbyPlayer, RoomRecord } from "@/types/lobby";

type SharedRoomGameProps = {
  room: RoomRecord;
  players: LobbyPlayer[];
  currentPlayer: LobbyPlayer | null;
  onLeaveRoom?: () => void;
  leavingRoom?: boolean;
};

function getViewMode(role: LobbyPlayer["role"] | undefined): ViewMode {
  return role === "summoner" ? "spymaster" : "player";
}

export function SharedRoomGame({
  room,
  players,
  currentPlayer,
  onLeaveRoom,
  leavingRoom = false,
}: SharedRoomGameProps) {
  const { locale, t, tm } = useI18n();
  const [isSubmittingSignal, setIsSubmittingSignal] = useState(false);
  const [isRevealingCard, setIsRevealingCard] = useState(false);
  const [isReturningToLobby, setIsReturningToLobby] = useState(false);
  const [isStartingRematch, setIsStartingRematch] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusBannerAnimated, setStatusBannerAnimated] = useState(false);
  const [signalAnnouncement, setSignalAnnouncement] = useState<{
    word: string;
    number: number;
  } | null>(null);
  const [highlightSignalPanel, setHighlightSignalPanel] = useState(false);
  const [gankCinematic, setGankCinematic] = useState<{
    visible: boolean;
    losingTeam: "blue" | "red";
    phase: GankCinematicPhase;
    variant: GankCinematicVariant;
    imageSrc: string;
  } | null>(null);
  const hasInitializedSignalRef = useRef(false);
  const previousSignalRef = useRef<string | null>(null);
  const previousFinishKeyRef = useRef<string | null>(null);
  const previousStatusKeyRef = useRef<string | null>(null);
  const signalAnnouncementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const signalPanelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gankTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const gameState = room.game_state;
  const sortBySlotIndex = (left: LobbyPlayer, right: LobbyPlayer) =>
    (left.slot_index ?? 0) - (right.slot_index ?? 0);
  const activePlayers = players.filter((player) => player.player_status !== "spectator");
  const spectatorPlayers = players.filter(
    (player) => player.player_status === "spectator",
  );

  const renderPlayerCard = (
    player: LobbyPlayer,
    className: string,
    nameClassName: string,
  ) => (
    <div
      key={player.id}
      className={className}
    >
      <div className="flex items-center gap-2">
        <img
          src={player.avatar || getDefaultAvatarForRole(player.role)}
          alt={player.display_name}
          className="h-10 w-10 rounded-lg border border-white/10 object-cover"
        />
        <p className={nameClassName}>
          {player.display_name}
        </p>
      </div>
    </div>
  );

  if (!gameState) {
    return (
      <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-100">
        {t("common.roomStateMissing")}
      </div>
    );
  }

  const playerStatus = currentPlayer?.player_status ?? "spectator";
  const playerRole = currentPlayer?.role;
  const playerSide = currentPlayer?.side;
  const isSpectator = playerStatus === "spectator" || !playerRole || !playerSide;
  const isHost = Boolean(currentPlayer?.is_host);
  const viewMode = getViewMode(playerRole);
  const isFinished = gameState.status === "finished";
  const isActiveSidePlayer = playerSide === gameState.activeSide;
  const signalActive =
    gameState.currentSignal !== null && gameState.picksRemaining !== null;
  const blueRemaining = gameState.cards.filter(
    (card) => card.role === "blue" && !card.revealed,
  ).length;
  const redRemaining = gameState.cards.filter(
    (card) => card.role === "red" && !card.revealed,
  ).length;
  const bluePlayers = activePlayers.filter((player) => player.side === "blue");
  const redPlayers = activePlayers.filter((player) => player.side === "red");
  const blueSummoners = bluePlayers
    .filter((player) => player.role === "summoner")
    .sort(sortBySlotIndex);
  const blueChampions = bluePlayers
    .filter((player) => player.role === "champion")
    .sort(sortBySlotIndex);
  const redSummoners = redPlayers
    .filter((player) => player.role === "summoner")
    .sort(sortBySlotIndex);
  const redChampions = redPlayers
    .filter((player) => player.role === "champion")
    .sort(sortBySlotIndex);
  const turnStateLabel = isSpectator
    ? t("common.spectating")
    : isActiveSidePlayer
      ? t("common.yourTurn")
      : t("common.waitingForEnemy");
  const actionHint = (() => {
    if (isFinished) {
      return t("common.matchFinished");
    }

    if (isSpectator) {
      return t("common.watchingCurrentMatch");
    }

    if (!isActiveSidePlayer) {
      return t("common.waitForOtherSide");
    }

    if (playerRole === "summoner") {
      return signalActive ? t("common.signalAlreadySent") : t("common.sendSignal");
    }

    if (playerRole === "champion") {
      return signalActive ? t("common.selectCards") : t("common.waitingForSummonerSignal");
    }

    return t("common.chooseSideAndRole");
  })();
  const canSubmitSignal =
    !isSpectator &&
    playerRole === "summoner" &&
    isActiveSidePlayer &&
    !isFinished &&
    !signalActive &&
    !isSubmittingSignal &&
    !isRevealingCard;
  const canRevealCards =
    !isSpectator &&
    playerRole === "champion" &&
    isActiveSidePlayer &&
    !isFinished &&
    signalActive &&
    !isSubmittingSignal &&
    !isRevealingCard;
  const waitingForSignal =
    !isFinished &&
    !signalActive &&
    playerRole === "champion" &&
    isActiveSidePlayer &&
    !isSpectator;
  const boardLocked = !canRevealCards;
  const displayCards = isFinished
    ? gameState.cards.map((card) => ({ ...card, revealed: true }))
    : gameState.cards;

  const statusClass = isActiveSidePlayer
    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
    : "border-white/10 bg-white/5 text-slate-200";
  const bluePanelClass =
    gameState.activeSide === "blue"
      ? "border-blue-200/80 bg-blue-500/20 shadow-[0_0_0_1px_rgba(147,197,253,0.42),0_0_32px_rgba(59,130,246,0.34),0_0_80px_rgba(37,99,235,0.36)] animate-rift-team-panel-pulse-blue"
      : "border-blue-500/12 bg-blue-500/5 opacity-82";
  const redPanelClass =
    gameState.activeSide === "red"
      ? "border-red-200/80 bg-red-500/20 shadow-[0_0_0_1px_rgba(252,165,165,0.42),0_0_32px_rgba(239,68,68,0.34),0_0_80px_rgba(220,38,38,0.36)] animate-rift-team-panel-pulse-red"
      : "border-red-500/12 bg-red-500/5 opacity-82";
  const blueTitleClass =
    gameState.activeSide === "blue" ? "text-blue-50" : "text-blue-100/88";
  const redTitleClass =
    gameState.activeSide === "red" ? "text-red-50" : "text-red-100/88";
  const signalKey = gameState.currentSignal
    ? `${gameState.currentSignal.word}:${gameState.currentSignal.number}`
    : null;

  useEffect(() => {
    return () => {
      if (signalAnnouncementTimeoutRef.current) {
        clearTimeout(signalAnnouncementTimeoutRef.current);
      }

      if (signalPanelTimeoutRef.current) {
        clearTimeout(signalPanelTimeoutRef.current);
      }

      if (statusBannerTimeoutRef.current) {
        clearTimeout(statusBannerTimeoutRef.current);
      }

      gankTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedSignalRef.current) {
      hasInitializedSignalRef.current = true;
      previousSignalRef.current = signalKey;
      return;
    }

    if (!signalKey || signalKey === previousSignalRef.current || !gameState.currentSignal) {
      previousSignalRef.current = signalKey;
      return;
    }

    previousSignalRef.current = signalKey;

    setSignalAnnouncement({
      word: gameState.currentSignal.word,
      number: gameState.currentSignal.number,
    });
    setHighlightSignalPanel(true);

    if (signalAnnouncementTimeoutRef.current) {
      clearTimeout(signalAnnouncementTimeoutRef.current);
    }

    if (signalPanelTimeoutRef.current) {
      clearTimeout(signalPanelTimeoutRef.current);
    }

    signalAnnouncementTimeoutRef.current = setTimeout(() => {
      setSignalAnnouncement(null);
      signalAnnouncementTimeoutRef.current = null;
    }, 1500);

    signalPanelTimeoutRef.current = setTimeout(() => {
      setHighlightSignalPanel(false);
      signalPanelTimeoutRef.current = null;
    }, 2600);
  }, [gameState.currentSignal, signalKey]);

  useEffect(() => {
    const statusKey = [
      gameState.activeSide,
      gameState.status,
      signalKey ?? "no-signal",
      gameState.picksRemaining ?? "no-picks",
      errorMessage,
      typeof gameState.message === "string"
        ? gameState.message
        : gameState.message.key,
    ].join(":");

    if (previousStatusKeyRef.current === null) {
      previousStatusKeyRef.current = statusKey;
      return;
    }

    if (previousStatusKeyRef.current === statusKey) {
      return;
    }

    previousStatusKeyRef.current = statusKey;
    setStatusBannerAnimated(true);

    if (statusBannerTimeoutRef.current) {
      clearTimeout(statusBannerTimeoutRef.current);
    }

    statusBannerTimeoutRef.current = setTimeout(() => {
      setStatusBannerAnimated(false);
      statusBannerTimeoutRef.current = null;
    }, 360);
  }, [
    errorMessage,
    gameState.activeSide,
    gameState.message,
    gameState.picksRemaining,
    gameState.status,
    signalKey,
  ]);

  useEffect(() => {
    const finishKey =
      gameState.status === "finished" && gameState.endReason === "gank" && gameState.loser
        ? `${gameState.endReason}:${gameState.loser}:${gameState.winner}`
        : null;

    if (!finishKey || finishKey === previousFinishKeyRef.current || !gameState.loser) {
      previousFinishKeyRef.current = finishKey;
      return;
    }

    previousFinishKeyRef.current = finishKey;

    const config = getGankCinematicConfig(gameState.loser);

    gankTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    gankTimeoutRefs.current = [];

    setGankCinematic({
      visible: true,
      losingTeam: gameState.loser,
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
  }, [gameState.endReason, gameState.loser, gameState.status, gameState.winner]);

  const handleSubmitSignal = async (clue: {
    word: string;
    number: number;
  }) => {
    if (!canSubmitSignal) {
      return;
    }

    try {
      setIsSubmittingSignal(true);
      setErrorMessage("");
      const nextState = submitSharedSignal(gameState, clue);
      await updateRoomGameState(room.id, nextState);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Signal submission failed:", normalizedError.message);
      setErrorMessage(normalizedError.message);
    } finally {
      setIsSubmittingSignal(false);
    }
  };

  const handleRevealCard = async (cardId: string) => {
    if (!canRevealCards) {
      return;
    }

    try {
      setIsRevealingCard(true);
      setErrorMessage("");
      const nextState = revealSharedGameCard(gameState, cardId);
      await updateRoomGameState(room.id, nextState);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Card reveal failed:", normalizedError.message);
      setErrorMessage(normalizedError.message);
    } finally {
      setIsRevealingCard(false);
    }
  };

  const handleBackToLobby = async () => {
    if (!isFinished || isReturningToLobby) {
      return;
    }

    try {
      setIsReturningToLobby(true);
      setErrorMessage("");
      await returnRoomToLobby(room.id);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Return to lobby failed:", normalizedError.message);
      setErrorMessage(normalizedError.message);
    } finally {
      setIsReturningToLobby(false);
    }
  };

  const handleRematch = async () => {
    if (!isFinished || !isHost || isStartingRematch) {
      return;
    }

    try {
      setIsStartingRematch(true);
      setErrorMessage("");
      await startSharedRoomGame(room.id, locale);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Rematch failed:", normalizedError.message);
      setErrorMessage(normalizedError.message);
    } finally {
      setIsStartingRematch(false);
    }
  };

  return (
    <div className={`rift-page-enter flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden pt-0 ${!isFinished ? "pb-[18rem] sm:pb-[15.5rem] lg:pb-48" : ""}`}>
      <RiftCluesLogo className="rift-logo-presence mb-0" compact />

      <div className="-mt-6 flex min-h-0 flex-1 flex-col gap-0.5 sm:-mt-7">
        <div className="absolute left-0 right-0 top-2 z-10 flex items-center justify-between gap-2 sm:top-3 sm:gap-3">
          <div className="rift-interactive-surface min-w-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-card backdrop-blur sm:px-3.5 sm:py-2 sm:text-sm">
            <span className="block truncate text-white/85">
              {t("sharedGame.roomLabel", { code: room.code })}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            {spectatorPlayers.length > 0 ? (
              <div className="flex max-w-[50vw] flex-wrap justify-end gap-2">
              {spectatorPlayers.map((player) => (
                <div
                  key={player.id}
                  className="rift-interactive-surface min-w-0 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 shadow-card backdrop-blur sm:px-3 sm:py-2 sm:text-[15px]"
                >
                  <span className="flex items-center gap-2">
                    <img
                      src={
                        player.avatar ||
                        getDefaultAvatarForRole(player.role)
                      }
                      alt={player.display_name}
                      className="h-8 w-8 rounded-full border border-white/10 object-cover"
                    />
                    <span className="block max-w-[8rem] truncate">{player.display_name}</span>
                  </span>
                </div>
              ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`mt-3.5 mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-white transition-[border-color,box-shadow,background-color,transform,opacity] duration-300 ease-out sm:mt-5.5 sm:mb-5 ${
          statusBannerAnimated ? "rift-banner-animated" : ""
        }`}>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <span className={`rift-status-chip rounded-full border px-2 py-1 font-bold uppercase tracking-[0.1em] ${statusClass}`}>
              {turnStateLabel}
            </span>
            <span className="max-w-full whitespace-normal rounded-full border border-white/10 bg-white/5 px-2 py-1 font-medium leading-tight text-slate-300">
              {actionHint}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px]">
            {isSpectator && !isFinished ? (
              <span className="text-slate-300">
                {t("sharedGame.spectatorJoined")}
              </span>
            ) : null}
            {(errorMessage || gameState.message) && !isFinished ? (
              <span className={errorMessage ? "text-red-300" : "text-slate-300"}>
                {errorMessage || tm(gameState.message)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="-mt-2 grid min-h-0 flex-1 gap-1.5 lg:-mt-2.5 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,11rem)] lg:items-stretch">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:contents">
            <aside className={`rift-page-enter-soft rounded-xl border px-3 py-3 text-white shadow-card backdrop-blur transition-[border-color,background-color,box-shadow,transform] duration-300 ${bluePanelClass}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                  {t("common.team")}
                </p>
                <h3 className={`mt-1 text-sm font-black sm:text-base ${blueTitleClass}`}>
                  {t("common.blueSide")}
                </h3>
              </div>
              {gameState.activeSide === "blue" ? (
                <span className="rounded-full border border-blue-300/35 bg-blue-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100">
                  {t("common.active")}
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {t("common.remaining")}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{blueRemaining}</p>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                  {t("common.summoner")}
                </p>
                <div className="mt-2 grid gap-2">
                  {blueSummoners.length > 0 ? (
                    blueSummoners.map((player) => (
                      renderPlayerCard(
                        player,
                        "rounded-lg border border-blue-300/20 bg-blue-400/10 px-2.5 py-2",
                        "truncate text-sm font-bold text-white",
                      )
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{t("sharedGame.noSummonerAssigned")}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t("common.champions")}
                </p>
                <div className="mt-2 grid gap-2">
                  {blueChampions.length > 0 ? (
                    blueChampions.map((player) => (
                      renderPlayerCard(
                        player,
                        "rounded-lg border border-white/10 bg-white/5 px-2.5 py-2",
                        "truncate text-sm font-semibold text-white",
                      )
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{t("sharedGame.noChampionsAssigned")}</p>
                  )}
                </div>
              </div>

            </div>
            </aside>

            <aside className={`rift-page-enter-soft rounded-xl border px-3 py-3 text-white shadow-card backdrop-blur transition-[border-color,background-color,box-shadow,transform] duration-300 lg:col-start-3 ${redPanelClass}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200/80">
                  {t("common.team")}
                </p>
                <h3 className={`mt-1 text-sm font-black sm:text-base ${redTitleClass}`}>
                  {t("common.redSide")}
                </h3>
              </div>
              {gameState.activeSide === "red" ? (
                <span className="rounded-full border border-red-300/35 bg-red-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-100">
                  {t("common.active")}
                </span>
              ) : null}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {t("common.remaining")}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{redRemaining}</p>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200/80">
                  {t("common.summoner")}
                </p>
                <div className="mt-2 grid gap-2">
                  {redSummoners.length > 0 ? (
                    redSummoners.map((player) => (
                      renderPlayerCard(
                        player,
                        "rounded-lg border border-red-300/20 bg-red-400/10 px-2.5 py-2",
                        "truncate text-sm font-bold text-white",
                      )
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{t("sharedGame.noSummonerAssigned")}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t("common.champions")}
                </p>
                <div className="mt-2 grid gap-2">
                  {redChampions.length > 0 ? (
                    redChampions.map((player) => (
                      renderPlayerCard(
                        player,
                        "rounded-lg border border-white/10 bg-white/5 px-2.5 py-2",
                        "truncate text-sm font-semibold text-white",
                      )
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">{t("sharedGame.noChampionsAssigned")}</p>
                  )}
                </div>
              </div>
            </div>
            </aside>
          </div>

          <div className="min-h-0 lg:col-start-2 lg:row-start-1">
            <GameBoard
              cards={displayCards}
              viewMode={viewMode}
              onReveal={(cardId) => void handleRevealCard(cardId)}
              locked={boardLocked}
              waitingForSignal={waitingForSignal}
            />
          </div>
        </div>
      </div>

      {signalAnnouncement ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="animate-rift-signal-announcement rounded-2xl border border-rift-gold/25 bg-slate-950/88 px-6 py-5 text-center text-white shadow-[0_24px_80px_rgba(2,6,23,0.48)] backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rift-gold/90">
              {t("sharedGame.signalSentToast")}
            </p>
            <p className="mt-3 animate-rift-signal-announcement-pop text-2xl font-black text-white sm:text-3xl">
              {signalAnnouncement.word} ({signalAnnouncement.number})
            </p>
          </div>
        </div>
      ) : null}

      {!isFinished ? (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/80 shadow-[0_-18px_50px_rgba(2,6,23,0.55)] backdrop-blur">
          <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 lg:px-6">
            <div className="pointer-events-auto">
              <CluePanel
                activeClue={gameState.currentSignal}
                picksRemaining={gameState.picksRemaining}
                activeTeam={gameState.activeSide}
                viewMode={viewMode}
                onSubmitClue={(clue) => void handleSubmitSignal(clue)}
                showForm={playerRole === "summoner" && isActiveSidePlayer}
                signalLocked={signalActive}
                disabled={isFinished || isSubmittingSignal || isRevealingCard}
                isSubmitting={isSubmittingSignal}
                highlightSignal={highlightSignalPanel}
              />
            </div>
          </div>
        </div>
      ) : null}

      {onLeaveRoom ? (
        <button
          type="button"
          onClick={onLeaveRoom}
          disabled={leavingRoom}
          className={`rift-button rift-button-secondary fixed right-4 z-40 rounded-full border border-white/10 bg-slate-950/72 px-3 py-2 text-xs font-semibold text-slate-200 shadow-[0_10px_30px_rgba(2,6,23,0.35)] backdrop-blur disabled:cursor-default disabled:opacity-60 sm:right-6 ${
            isFinished ? "bottom-12" : "bottom-[14.25rem] sm:bottom-[12.5rem] lg:bottom-32"
          }`}
        >
          {leavingRoom ? t("common.leaving") : t("common.leaveRoom")}
        </button>
      ) : null}

      {isFinished && !gankCinematic?.visible ? (
        <SharedMatchEndScreen
          winner={gameState.winner}
          loser={gameState.loser}
          endReason={gameState.endReason}
          message={gameState.message}
          isHost={isHost}
          isStartingRematch={isStartingRematch}
          isReturningToLobby={isReturningToLobby}
          onRematch={() => void handleRematch()}
          onBackToLobby={() => void handleBackToLobby()}
          onLeaveRoom={onLeaveRoom}
          leavingRoom={leavingRoom}
          playerSide={playerSide}
        />
      ) : null}

      {gankCinematic?.visible ? (
        <GankImageCinematicOverlay
          phase={gankCinematic.phase}
          imageSrc={gankCinematic.imageSrc}
          variant={gankCinematic.variant}
        />
      ) : null}
    </div>
  );
}
