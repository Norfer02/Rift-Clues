"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import type { ActiveClue, Team, ViewMode } from "@/types/game";

type CluePanelProps = {
  activeClue: ActiveClue | null;
  picksRemaining: number | null;
  activeTeam: Team;
  viewMode: ViewMode;
  onSubmitClue: (clue: ActiveClue) => void;
  showForm: boolean;
  signalLocked?: boolean;
  disabled?: boolean;
  isSubmitting?: boolean;
  hideSummary?: boolean;
  highlightSignal?: boolean;
};

export function CluePanel({
  activeClue,
  picksRemaining,
  activeTeam,
  viewMode,
  onSubmitClue,
  showForm,
  signalLocked = false,
  disabled = false,
  isSubmitting = false,
  hideSummary = false,
  highlightSignal = false,
}: CluePanelProps) {
  const { t } = useI18n();
  const [clueWord, setClueWord] = useState("");
  const [clueNumber, setClueNumber] = useState("1");
  const [justSent, setJustSent] = useState(false);
  const [showSignalAnnouncement, setShowSignalAnnouncement] = useState(false);
  const [announcementSignal, setAnnouncementSignal] = useState<ActiveClue | null>(null);
  const [picksPulse, setPicksPulse] = useState(false);
  const previousActiveTeamRef = useRef<Team>(activeTeam);
  const signalKey = activeClue ? `${activeClue.word}:${activeClue.number}` : null;
  const previousSignalKeyRef = useRef<string | null>(signalKey);
  const previousPicksRef = useRef<number | null>(picksRemaining);
  const wordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (previousActiveTeamRef.current !== activeTeam) {
      previousActiveTeamRef.current = activeTeam;
      setClueWord("");
      setClueNumber("1");
      setShowSignalAnnouncement(false);
      setAnnouncementSignal(null);
    }
  }, [activeTeam]);

  useEffect(() => {
    if (signalKey && signalKey !== previousSignalKeyRef.current && activeClue) {
      setClueWord("");
      setClueNumber("1");
      setJustSent(true);
      setAnnouncementSignal(activeClue);
      setShowSignalAnnouncement(true);
    }

    previousSignalKeyRef.current = signalKey;
  }, [activeClue, signalKey]);

  useEffect(() => {
    if (!justSent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setJustSent(false);
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [justSent]);

  useEffect(() => {
    if (!showSignalAnnouncement) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSignalAnnouncement(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSignalAnnouncement]);

  useEffect(() => {
    if (previousPicksRef.current !== null && previousPicksRef.current !== picksRemaining) {
      setPicksPulse(true);
      const timeoutId = window.setTimeout(() => {
        setPicksPulse(false);
      }, 320);

      previousPicksRef.current = picksRemaining;

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    previousPicksRef.current = picksRemaining;
  }, [picksRemaining]);

  useEffect(() => {
    if (!showForm || signalLocked || disabled || isSubmitting) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      if (document.activeElement === document.body) {
        wordInputRef.current?.focus();
      }
    }, 10);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [showForm, signalLocked, disabled, isSubmitting, activeTeam]);

  const normalizedWord = clueWord.trim().replace(/\s+/g, " ");
  const parsedNumber = Number.parseInt(clueNumber, 10);
  const hasWord = normalizedWord.length > 0;
  const hasValidNumber = !Number.isNaN(parsedNumber) && parsedNumber >= 1;
  const canSend =
    showForm &&
    !signalLocked &&
    !disabled &&
    !isSubmitting &&
    hasWord &&
    hasValidNumber;
  const turnLabel = activeTeam === "blue" ? t("common.blueSide") : t("common.redSide");
  const signalStatusLabel = signalLocked
    ? t("cluePanel.lockedIn")
    : t("cluePanel.awaitingSignal");
  const signalStatusTone =
    activeTeam === "blue"
      ? signalLocked
        ? "border-blue-300/30 bg-blue-400/15 text-blue-100"
        : "border-blue-400/15 bg-blue-500/10 text-blue-100/80"
      : signalLocked
        ? "border-red-300/30 bg-red-400/15 text-red-100"
        : "border-red-400/15 bg-red-500/10 text-red-100/80";
  const validationMessage = (() => {
    if (signalLocked) {
      return t("cluePanel.signalAlreadySentRound");
    }

    if (isSubmitting) {
      return t("cluePanel.sendingSignal");
    }

    if (disabled) {
      return t("cluePanel.controlsUnavailable");
    }

    if (!hasWord) {
      return t("cluePanel.enterOneWordSignal");
    }

    if (!hasValidNumber) {
      return t("cluePanel.numberAtLeastOne");
    }

    return t("cluePanel.pressEnterReady");
  })();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    onSubmitClue({
      word: normalizedWord,
      number: parsedNumber,
    });
  };

  const updateNumber = (nextValue: number) => {
    setClueNumber(String(Math.max(1, nextValue)));
  };

  const handleNumberBlur = () => {
    if (Number.isNaN(parsedNumber) || parsedNumber < 1) {
      setClueNumber("1");
    }
  };

  const picksBadgeClass =
    activeTeam === "blue"
      ? "bg-blue-500/20 text-blue-100 ring-1 ring-blue-400/40"
      : "bg-red-500/20 text-red-100 ring-1 ring-red-400/40";
  const finalPickClass =
    activeTeam === "blue" ? "text-blue-200" : "text-red-200";
  const passivePanelTitle =
    viewMode === "spymaster" ? t("common.signalStatus") : t("common.championStatus");
  const passivePanelMessage = (() => {
    if (showForm) {
      return t("cluePanel.typeAndSendNextSignal");
    }

    if (viewMode === "spymaster") {
      return signalLocked
        ? t("cluePanel.signalAlreadySentRound")
        : t("cluePanel.waitForSideToBeActive");
    }

    return activeClue
      ? t("cluePanel.useCurrentSignal")
      : t("cluePanel.waitForSummonerToSend");
  })();
  const hudTeamAccent =
    activeTeam === "blue"
      ? "border-blue-400/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(15,23,42,0.88))]"
      : "border-red-400/20 bg-[linear-gradient(135deg,rgba(220,38,38,0.18),rgba(15,23,42,0.88))]";
  const hudSignalText = activeClue
    ? `${activeClue.word} (${activeClue.number})`
    : t("common.noSignal");
  const isInlineEditable = viewMode === "spymaster" && showForm;
  const showInlineValidation = !signalLocked && !isSubmitting && (!hasWord || !hasValidNumber);

  return (
    <>
      <section
        className={`relative rounded-[1.15rem] border p-2.5 shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur-xl ${hudTeamAccent} ${
          highlightSignal ? "animate-rift-signal-panel-pulse" : ""
        } ${
          justSent ? "animate-rift-signal-sent-shell" : ""
        } ${signalLocked ? "rift-panel-ambient" : ""}`}
      >
        <form
          onSubmit={handleSubmit}
          className="flex min-h-[74px] flex-wrap items-center gap-2 sm:min-h-[82px] sm:gap-3"
        >
          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5 transition-[border-color,box-shadow,background-color] duration-300 ease-out">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-rift-gold sm:text-[11px]">
              {t("common.currentTurn")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p
                className={`truncate text-sm font-black text-white sm:text-base ${
                  justSent ? "animate-rift-signal-sent-content" : ""
                }`}
              >
                {turnLabel} <span className="text-white/45">|</span> {hudSignalText}
              </p>
              {justSent ? (
                <span className="animate-rift-signal-sent-badge rounded-full border border-rift-gold/30 bg-rift-gold/14 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rift-gold">
                  {t("cluePanel.signalSent")}
                </span>
              ) : null}
            </div>
            <p
              className={`mt-1 truncate text-[11px] ${
                showInlineValidation ? "text-red-300" : "text-slate-400"
              } ${justSent && !showInlineValidation ? "animate-rift-signal-sent-subtle" : ""}`}
            >
              {signalLocked
                ? t("cluePanel.signalLockedRound")
                : showInlineValidation
                  ? validationMessage
                  : passivePanelMessage}
            </p>
          </div>

          {!hideSummary ? (
            <div className="shrink-0 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-center transition-[border-color,box-shadow,background-color] duration-300 ease-out">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px]">
                {t("common.picks")}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${picksBadgeClass} ${picksPulse ? "rift-count-pulse" : ""}`}>
                  {picksRemaining ?? 0}
                </span>
                {picksRemaining === 1 ? (
                  <span className={`hidden text-[11px] font-semibold sm:inline ${finalPickClass}`}>
                    {t("common.final")}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {isInlineEditable ? (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-[980px]:flex-nowrap">
              <label className="min-w-[180px] flex-1 min-[980px]:max-w-[240px]">
                <span className="sr-only">{t("cluePanel.signalWord")}</span>
                <input
                  ref={wordInputRef}
                  type="text"
                  value={clueWord}
                  onChange={(event) => setClueWord(event.target.value)}
                  placeholder={t("cluePanel.signalWord")}
                  disabled={disabled || signalLocked || isSubmitting}
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                  className={`rift-input h-11 w-full rounded-2xl border bg-slate-900/90 px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 ${
                    showInlineValidation && !hasWord
                      ? "border-red-400/45"
                      : "border-white/10 focus:border-rift-gold/60"
                  }`}
                />
              </label>

              <div className="grid h-11 min-w-[128px] grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/90 p-1">
                <button
                  type="button"
                  onClick={() => updateNumber((Number.isNaN(parsedNumber) ? 1 : parsedNumber) - 1)}
                  disabled={disabled || signalLocked || isSubmitting || (!Number.isNaN(parsedNumber) && parsedNumber <= 1)}
                  className="rift-button rift-button-secondary inline-flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base font-black text-white disabled:cursor-default disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={clueNumber}
                  onChange={(event) => setClueNumber(event.target.value)}
                  onBlur={handleNumberBlur}
                  disabled={disabled || signalLocked || isSubmitting}
                  className="rift-input signal-number-input h-full rounded-xl border border-transparent bg-transparent px-1 text-center text-sm font-black text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateNumber(Number.isNaN(parsedNumber) ? 1 : parsedNumber + 1)}
                  disabled={disabled || signalLocked || isSubmitting}
                  className="rift-button rift-button-secondary inline-flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base font-black text-white disabled:cursor-default disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="submit"
                  disabled={!canSend}
                  className={`rift-button ${canSend ? "rift-button-primary" : "rift-button-secondary"} inline-flex h-11 items-center justify-center rounded-2xl px-4 text-xs font-black uppercase tracking-[0.14em] sm:min-w-[140px] sm:text-sm ${
                    canSend
                      ? "bg-rift-gold text-slate-950 shadow-[0_10px_24px_rgba(246,196,83,0.22)] hover:bg-[#ffd778]"
                      : signalLocked
                        ? "border border-rift-gold/25 bg-rift-gold/12 text-rift-gold"
                        : "bg-white/8 text-slate-500"
                  } disabled:cursor-default`}
                >
                  {isSubmitting
                    ? t("cluePanel.sendingSignal")
                    : signalLocked
                      ? t("cluePanel.signalSent")
                      : t("cluePanel.sendSignal")}
                </button>
                {showInlineValidation ? (
                  <p className="text-[11px] text-red-300">{validationMessage}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="shrink-0">
              <div
                className={`rift-status-chip inline-flex h-11 items-center justify-center rounded-2xl px-4 text-xs font-black uppercase tracking-[0.14em] sm:min-w-[140px] sm:text-sm ${
                  signalLocked
                    ? "border border-rift-gold/25 bg-rift-gold/12 text-rift-gold"
                    : "border border-white/10 bg-white/8 text-slate-400"
                }`}
              >
                {signalLocked ? signalStatusLabel : passivePanelTitle}
              </div>
            </div>
          )}
        </form>
      </section>

      {showSignalAnnouncement && announcementSignal && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_32%),radial-gradient(circle_at_bottom,rgba(246,196,83,0.08),transparent_28%),rgba(2,6,23,0.42)] backdrop-blur-[5px]" />
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <div className="rift-modal-surface relative w-full max-w-[28rem] overflow-hidden rounded-[1.6rem] border border-white/12 bg-[linear-gradient(165deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94)_58%,rgba(10,14,24,0.98))] shadow-[0_32px_80px_rgba(2,6,23,0.58),0_0_0_1px_rgba(255,255,255,0.04),0_0_56px_rgba(56,189,248,0.08)] backdrop-blur-2xl">
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rift-gold/65 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(246,196,83,0.16),transparent_68%)]" />
                  <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-blue-400/8 blur-3xl" />
                  <div className="pointer-events-none absolute -right-16 bottom-6 h-40 w-40 rounded-full bg-rift-gold/10 blur-3xl" />

                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rift-gold/90">
                          {t("cluePanel.tacticalBroadcast")}
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-[0.01em] text-white sm:text-2xl">
                          {t("cluePanel.signalSent")}
                        </h3>
                        <p className="mt-2 max-w-[24rem] text-sm leading-6 text-slate-300">
                          {t("cluePanel.championsNowPlay", { team: turnLabel })}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${signalStatusTone}`}>
                        {signalStatusLabel}
                      </span>
                    </div>

                    <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="mt-5 grid gap-4">
                      <div className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.24))] p-[1px]">
                        <div className="animate-rift-command-broadcast rounded-[1.1rem] bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {t("cluePanel.proposedSignal")}
                          </p>
                          <div className="mt-3 flex items-center justify-center gap-3">
                            <span className="animate-rift-command-signal text-2xl font-black tracking-[0.04em] text-white sm:text-3xl">
                              {announcementSignal.word}
                            </span>
                            <span className="text-white/24">/</span>
                            <span className="animate-rift-command-signal text-2xl font-black tracking-[0.04em] text-rift-gold sm:text-3xl">
                              {announcementSignal.number}
                            </span>
                          </div>
                          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                            {t("cluePanel.tacticalBroadcastConfirmed")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-[1.05rem] border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                        <p className="text-[11px] font-medium text-slate-300">
                          {t("cluePanel.signalTransmitted")}
                        </p>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${signalStatusTone}`}>
                          {signalStatusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
