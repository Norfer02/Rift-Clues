"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  getAvatarOptionsForRole,
  getDefaultAvatarForRole,
  isAvatarValidForRole,
} from "@/lib/champion-avatars";
import {
  getOrCreateLocalPlayerId,
  getStoredAvatar,
  getStoredDisplayName,
  setStoredAvatar,
  setStoredDisplayName,
} from "@/lib/local-player";
import {
  fetchPlayersByRoomId,
  fetchRoomByCode,
  sortLobbyPlayers,
  toLobbyError,
} from "@/lib/lobby-supabase";
import {
  apiEnsurePlayer,
  apiLeaveRoom,
  apiRandomizeTeams,
  apiStartGame,
  apiUpdatePlayerSelection,
} from "@/lib/lobby-api";
import { missingSupabaseEnvErrorMessage } from "@/lib/supabase-errors";
import { getSupabase } from "@/lib/supabase";
import type { LobbyPlayer, RoomRecord } from "@/types/lobby";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SharedRoomGame } from "@/components/shared-room-game";

type RoomLobbyProps = {
  code: string;
};

export function RoomLobby({
  code,
}: RoomLobbyProps) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const normalizedCode = code.toUpperCase();
  const [isMounted, setIsMounted] = useState(false);
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [hasStoredDisplayName, setHasStoredDisplayName] = useState(false);
  const [joining, setJoining] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingSelection, setSavingSelection] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [randomizingTeams, setRandomizingTeams] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const hasLeftRoomRef = useRef(false);
  const latestLoadRequestIdRef = useRef(0);
  const roomRef = useRef<RoomRecord | null>(null);
  const currentPlayerRef = useRef<LobbyPlayer | null>(null);

  const currentPlayer = useMemo(
    () => players.find((player) => player.player_id === playerId) ?? null,
    [playerId, players],
  );
  const activePlayers = useMemo(
    () => players.filter((player) => player.player_status !== "spectator"),
    [players],
  );
  const spectatorPlayers = useMemo(
    () =>
      players.filter(
        (player) =>
          player.player_status === "spectator" ||
          (player.side === null && player.role === null),
      ),
    [players],
  );
  const slotCards = useMemo(
    () => [
      {
        key: "blue-summoner",
        side: "blue" as const,
        role: "summoner" as const,
        slotIndex: 0,
        title: t("roomLobby.blueSummoner"),
        teamLabel: t("common.blueSide"),
        accentClass:
          "border-blue-200/35 bg-[linear-gradient(160deg,rgba(37,99,235,0.2),rgba(15,23,42,0.82)_65%,rgba(2,6,23,0.9))] hover:border-rift-gold/35 hover:bg-[linear-gradient(160deg,rgba(37,99,235,0.24),rgba(15,23,42,0.84)_65%,rgba(2,6,23,0.92))]",
        badgeClass: "border-rift-gold/30 bg-rift-gold/14 text-rift-gold",
      },
      {
        key: "blue-champion-1",
        side: "blue" as const,
        role: "champion" as const,
        slotIndex: 0,
        title: t("roomLobby.blueChampion", { index: 1 }),
        teamLabel: t("common.blueSide"),
        accentClass:
          "border-blue-300/16 bg-blue-500/8 hover:border-blue-200/28 hover:bg-blue-500/12",
        badgeClass: "border-blue-300/30 bg-blue-400/15 text-blue-100",
      },
      {
        key: "blue-champion-2",
        side: "blue" as const,
        role: "champion" as const,
        slotIndex: 1,
        title: t("roomLobby.blueChampion", { index: 2 }),
        teamLabel: t("common.blueSide"),
        accentClass:
          "border-blue-300/16 bg-blue-500/8 hover:border-blue-200/28 hover:bg-blue-500/12",
        badgeClass: "border-blue-300/30 bg-blue-400/15 text-blue-100",
      },
      {
        key: "blue-champion-3",
        side: "blue" as const,
        role: "champion" as const,
        slotIndex: 2,
        title: t("roomLobby.blueChampion", { index: 3 }),
        teamLabel: t("common.blueSide"),
        accentClass:
          "border-blue-300/16 bg-blue-500/8 hover:border-blue-200/28 hover:bg-blue-500/12",
        badgeClass: "border-blue-300/30 bg-blue-400/15 text-blue-100",
      },
      {
        key: "red-summoner",
        side: "red" as const,
        role: "summoner" as const,
        slotIndex: 0,
        title: t("roomLobby.redSummoner"),
        teamLabel: t("common.redSide"),
        accentClass:
          "border-red-200/35 bg-[linear-gradient(160deg,rgba(220,38,38,0.2),rgba(24,10,16,0.84)_65%,rgba(8,6,10,0.92))] hover:border-rift-gold/35 hover:bg-[linear-gradient(160deg,rgba(220,38,38,0.24),rgba(24,10,16,0.86)_65%,rgba(8,6,10,0.94))]",
        badgeClass: "border-rift-gold/30 bg-rift-gold/14 text-rift-gold",
      },
      {
        key: "red-champion-1",
        side: "red" as const,
        role: "champion" as const,
        slotIndex: 0,
        title: t("roomLobby.redChampion", { index: 1 }),
        teamLabel: t("common.redSide"),
        accentClass:
          "border-red-300/16 bg-red-500/8 hover:border-red-200/28 hover:bg-red-500/12",
        badgeClass: "border-red-300/30 bg-red-400/15 text-red-100",
      },
      {
        key: "red-champion-2",
        side: "red" as const,
        role: "champion" as const,
        slotIndex: 1,
        title: t("roomLobby.redChampion", { index: 2 }),
        teamLabel: t("common.redSide"),
        accentClass:
          "border-red-300/16 bg-red-500/8 hover:border-red-200/28 hover:bg-red-500/12",
        badgeClass: "border-red-300/30 bg-red-400/15 text-red-100",
      },
      {
        key: "red-champion-3",
        side: "red" as const,
        role: "champion" as const,
        slotIndex: 2,
        title: t("roomLobby.redChampion", { index: 3 }),
        teamLabel: t("common.redSide"),
        accentClass:
          "border-red-300/16 bg-red-500/8 hover:border-red-200/28 hover:bg-red-500/12",
        badgeClass: "border-red-300/30 bg-red-400/15 text-red-100",
      },
    ],
    [t],
  );
  const isPlaying = room?.status === "playing";
  const canEditSelection = room?.status === "lobby";
  const assignablePlayers = useMemo(
    () => players.filter((player) => player.player_status !== "spectator"),
    [players],
  );
  const lobbyRequirements = useMemo(
    () => [
      {
        key: "blue-summoner",
        label: t("roomLobby.blueSideSummoner"),
        met: activePlayers.some(
          (player) =>
            player.side === "blue" &&
            player.role === "summoner" &&
            player.slot_index === 0,
        ),
      },
      {
        key: "blue-champion-1",
        label: t("roomLobby.blueSideChampion", { index: 1 }),
        met: activePlayers.some(
          (player) =>
            player.side === "blue" &&
            player.role === "champion" &&
            player.slot_index === 0,
        ),
      },
      {
        key: "blue-champion-2",
        label: t("roomLobby.blueSideChampion", { index: 2 }),
        met: activePlayers.some(
          (player) =>
            player.side === "blue" &&
            player.role === "champion" &&
            player.slot_index === 1,
        ),
      },
      {
        key: "blue-champion-3",
        label: t("roomLobby.blueSideChampion", { index: 3 }),
        met: activePlayers.some(
          (player) =>
            player.side === "blue" &&
            player.role === "champion" &&
            player.slot_index === 2,
        ),
      },
      {
        key: "red-summoner",
        label: t("roomLobby.redSideSummoner"),
        met: activePlayers.some(
          (player) =>
            player.side === "red" &&
            player.role === "summoner" &&
            player.slot_index === 0,
        ),
      },
      {
        key: "red-champion-1",
        label: t("roomLobby.redSideChampion", { index: 1 }),
        met: activePlayers.some(
          (player) =>
            player.side === "red" &&
            player.role === "champion" &&
            player.slot_index === 0,
        ),
      },
      {
        key: "red-champion-2",
        label: t("roomLobby.redSideChampion", { index: 2 }),
        met: activePlayers.some(
          (player) =>
            player.side === "red" &&
            player.role === "champion" &&
            player.slot_index === 1,
        ),
      },
      {
        key: "red-champion-3",
        label: t("roomLobby.redSideChampion", { index: 3 }),
        met: activePlayers.some(
          (player) =>
            player.side === "red" &&
            player.role === "champion" &&
            player.slot_index === 2,
        ),
      },
    ],
    [activePlayers, t],
  );
  const isLobbyValid = activePlayers.length >= 1;

  const lobbyUiError = useCallback(
    (message: string) => {
      switch (message) {
        case "Room not found.":
          return t("roomLobby.roomNotFound");
        case "Enter a display name to join this lobby.":
          return t("roomLobby.invalidDisplayName");
        case "Display name must be 24 characters or fewer.":
          return t("roomLobby.displayNameTooLong");
        case "Selections are locked during the game.":
          return t("roomLobby.selectionLocked");
        case "Player not found.":
          return t("roomLobby.playerNotFound");
        case "Summoner slots must use slot 1.":
          return t("roomLobby.summonerSeatRule");
        case "Champion slots must use a valid seat.":
          return t("roomLobby.championSeatRule");
        case "That slot is already taken.":
          return t("roomLobby.slotTaken");
        case missingSupabaseEnvErrorMessage:
          return t("roomLobby.supabaseConfigMissing");
        default:
          if (message.toLowerCase().includes("failed to fetch")) {
            return t("roomLobby.networkRequestFailed");
          }

          return message;
      }
    },
    [t],
  );

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const loadLobby = useCallback(async (roomData?: RoomRecord | null) => {
    const requestId = latestLoadRequestIdRef.current + 1;
    latestLoadRequestIdRef.current = requestId;
    const currentRoom = roomData ?? (await fetchRoomByCode(normalizedCode));

    if (!currentRoom) {
      if (requestId !== latestLoadRequestIdRef.current) {
        return null;
      }

      setErrorMessage(t("roomLobby.roomNotFound"));
      setRoom(null);
      setPlayers([]);
      return null;
    }

    const playerRows = await fetchPlayersByRoomId(currentRoom.id);

    if (requestId !== latestLoadRequestIdRef.current) {
      return currentRoom;
    }

    setRoom(currentRoom);
    setPlayers(sortLobbyPlayers(playerRows));
    return currentRoom;
  }, [normalizedCode, t]);

  const refreshPlayersForRoom = useCallback(async (roomId: string) => {
    const playerRows = await fetchPlayersByRoomId(roomId);
    const freshPlayers = sortLobbyPlayers(playerRows);

    console.log("ROOM PLAYERS REFRESH COUNT:", freshPlayers.length);
    console.log(
      "ROOM SPECTATORS REFRESH COUNT:",
      freshPlayers.filter((player) => player.player_status === "spectator").length,
    );

    setPlayers(freshPlayers);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const storedName = getStoredDisplayName();
    const storedAvatar = getStoredAvatar() || getDefaultAvatarForRole("champion");
    const localPlayerId = getOrCreateLocalPlayerId();

    setDisplayName(storedName);
    setPlayerId(localPlayerId);
    setHasStoredDisplayName(Boolean(storedName.trim()));

    const initializeLobby = async () => {
      try {
        const currentRoom = await fetchRoomByCode(normalizedCode);

        if (!currentRoom) {
          setErrorMessage(t("roomLobby.roomNotFound"));
          setJoining(false);
          return;
        }

        if (storedName.trim()) {
          await apiEnsurePlayer({
            roomCode: normalizedCode,
            playerId: localPlayerId,
            displayName: storedName.trim(),
            avatar: storedAvatar,
          });
        } else {
          setErrorMessage(t("roomLobby.enterDisplayNameToJoin"));
        }

        await loadLobby(currentRoom);
      } catch (error) {
        const normalizedError = toLobbyError(error);
        console.error("Lobby load failed:", normalizedError.message);
        setErrorMessage(lobbyUiError(normalizedError.message));
      } finally {
        setJoining(false);
      }
    };

    void initializeLobby();
  }, [isMounted, loadLobby, normalizedCode]);

  useEffect(() => {
    if (!room?.id) {
      return;
    }

    let realtimeClient;

    try {
      realtimeClient = getSupabase();
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Lobby realtime setup failed:", error);
      setErrorMessage(lobbyUiError(normalizedError.message));
      return;
    }

    const channel = realtimeClient
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log("ROOM PLAYERS REALTIME EVENT:", payload.eventType);
          void refreshPlayersForRoom(room.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        () => {
          void loadLobby();
        },
      )
      .subscribe();

    return () => {
      void realtimeClient.removeChannel(channel);
    };
  }, [lobbyUiError, loadLobby, refreshPlayersForRoom, room?.id]);

  const leaveCurrentRoom = useCallback(async (reason: string = "unknown") => {
    const currentRoom = roomRef.current;
    const player = currentPlayerRef.current;

    if (!currentRoom || !player || hasLeftRoomRef.current) {
      return;
    }

    console.log("ROOM LEAVE CLEANUP TRIGGERED:", {
      reason,
      roomId: currentRoom.id,
      playerId: player.player_id,
    });

    hasLeftRoomRef.current = true;

    await apiLeaveRoom(
      {
        roomId: currentRoom.id,
        playerId: player.player_id,
      },
      {
        keepalive: reason === "pagehide" || reason === "beforeunload",
      },
    );
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      void leaveCurrentRoom("pagehide");
    };

    const handleBeforeUnload = () => {
      void leaveCurrentRoom("beforeunload");
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void leaveCurrentRoom("unmount");
    };
  }, [leaveCurrentRoom]);

  const handleSaveDisplayName = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMessage(t("roomLobby.invalidDisplayName"));
      return;
    }

    if (trimmedName.length > 24) {
      setErrorMessage(t("roomLobby.displayNameTooLong"));
      return;
    }

    try {
      setJoining(true);
      setStoredDisplayName(trimmedName);
      setHasStoredDisplayName(true);
      setErrorMessage("");

      const currentRoom = await fetchRoomByCode(normalizedCode);
      if (!currentRoom) {
        setErrorMessage(t("roomLobby.roomNotFound"));
        return;
      }

      await apiEnsurePlayer({
        roomCode: normalizedCode,
        playerId,
        displayName: trimmedName,
        avatar: getStoredAvatar() || getDefaultAvatarForRole("champion"),
      });
      await loadLobby(currentRoom);
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Save display name failed:", normalizedError.message);
      setErrorMessage(lobbyUiError(normalizedError.message));
    } finally {
      setJoining(false);
    }
  };

  const handleSelectionUpdate = async (
    patch: Partial<
      Pick<LobbyPlayer, "side" | "role" | "avatar" | "slot_index" | "player_status">
    >,
  ) => {
    if (!currentPlayer || !room || !canEditSelection) {
      return;
    }

    try {
      setSavingSelection(true);
      setErrorMessage("");
      const nextRole = patch.role ?? currentPlayer.role;
      const nextAvatar =
        patch.avatar ??
        (isAvatarValidForRole(currentPlayer.avatar, nextRole)
          ? currentPlayer.avatar
          : getDefaultAvatarForRole(nextRole));

      await apiUpdatePlayerSelection({
        roomId: room.id,
        playerId: currentPlayer.player_id,
        patch: {
          ...patch,
          avatar: nextAvatar,
          player_status:
            patch.player_status ??
            (patch.side || patch.role || patch.slot_index !== undefined
              ? "active"
              : currentPlayer.player_status),
        },
      });

      if (nextAvatar) {
        setStoredAvatar(nextAvatar);
      }
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Selection update failed:", normalizedError.message);
      setErrorMessage(lobbyUiError(normalizedError.message));
    } finally {
      setSavingSelection(false);
    }
  };

  const handleStartGame = async () => {
    if (!room || !currentPlayer?.is_host || !isLobbyValid) {
      return;
    }

    try {
      setStartingGame(true);
      setErrorMessage("");
      if (activePlayers.length < 2) {
        console.warn(
          "Starting multiplayer test game with fewer than 2 players.",
        );
      }
      await apiStartGame({
        roomId: room.id,
        playerId: currentPlayer.player_id,
        locale,
      });
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Start game failed:", normalizedError.message);
      setErrorMessage(lobbyUiError(normalizedError.message));
    } finally {
      setStartingGame(false);
    }
  };

  const handleRandomizeTeams = async () => {
    if (!room || !currentPlayer?.is_host || !canEditSelection || randomizingTeams) {
      return;
    }

    const availablePlayers = [...assignablePlayers];

    if (slotCards.length === 0 || availablePlayers.length === 0) {
      setSuccessMessage(
        availablePlayers.length === 0
          ? t("roomLobby.noPlayersAvailable")
          : t("roomLobby.noSlotsAvailable"),
      );
      return;
    }

    try {
      setRandomizingTeams(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await apiRandomizeTeams({
        roomId: room.id,
        playerId: currentPlayer.player_id,
      });
      await loadLobby(room);
      setSuccessMessage(
        result.waitingCount > 0
          ? t("roomLobby.reshuffledWaiting", {
              count: result.assignedCount,
              waiting: result.waitingCount,
            })
          : t("roomLobby.reshuffled", { count: result.assignedCount }),
      );
    } catch (error) {
      const normalizedError = toLobbyError(error);
      console.error("Random team assignment failed:", normalizedError.message);
      setErrorMessage(lobbyUiError(normalizedError.message));
    } finally {
      setRandomizingTeams(false);
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(normalizedCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1400);
    } catch (error) {
      console.error("Copy room code failed:", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room || !currentPlayer || leavingRoom) {
      return;
    }

    try {
      setLeavingRoom(true);
      setErrorMessage("");
      await leaveCurrentRoom("leave-button");
      setPlayers((currentPlayers) =>
        currentPlayers.filter((player) => player.player_id !== currentPlayer.player_id),
      );
      router.push("/");
    } catch (error) {
      hasLeftRoomRef.current = false;
      const normalizedError = toLobbyError(error);
      console.error("Leave room failed:", normalizedError.message);
      setErrorMessage(lobbyUiError(normalizedError.message));
      setLeavingRoom(false);
    }
  };

  const handleOpenLeaveConfirm = () => {
    if (!currentPlayer || leavingRoom) {
      return;
    }

    setShowLeaveConfirm(true);
  };

  const handleCloseLeaveConfirm = () => {
    if (leavingRoom) {
      return;
    }

    setShowLeaveConfirm(false);
  };

  const handleConfirmLeaveRoom = async () => {
    await handleLeaveRoom();
  };

  return (
    <main className={`relative ${isPlaying ? "h-[100dvh]" : "min-h-screen"} overflow-hidden`}>
      <div className="fixed inset-0 -z-20">
        <img
          src="/cinematics/faille.png"
          alt="background"
          className="h-full w-full object-cover blur-[1.5px]"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/50" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

      <div
        className={`relative z-10 ${isPlaying ? "h-full p-4 sm:p-6" : "min-h-screen p-6"}`}
      >
      {!isMounted ? (
        <>
          <h1>{t("sharedGame.roomLabel", { code: normalizedCode })}</h1>
          <p>{t("common.status")}: {t("common.loading")}</p>
          <div className="mt-4">
            <label htmlFor="lobby-display-name">{t("roomLobby.displayName")}</label>
            <input
              id="lobby-display-name"
              type="text"
              value=""
              readOnly
              className="ml-2 border px-2 py-1 text-black"
            />
            <button type="button" className="ml-2" disabled>
              {t("roomLobby.saveName")}
            </button>
          </div>
          <div className="mt-6">
            <h2>{t("roomLobby.players")}</h2>
            <p>{t("common.loading")}</p>
            <ul />
          </div>
        </>
      ) : null}

      {isMounted && room?.status === "playing" ? (
        <SharedRoomGame
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          onLeaveRoom={handleOpenLeaveConfirm}
          leavingRoom={leavingRoom}
        />
      ) : null}

      {isMounted && room?.status !== "playing" ? (
        <>
          <section className="mx-auto flex min-h-full w-full max-w-[1180px] items-center justify-center py-4 sm:py-6">
            <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950/76 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-rift-gold/85">
                    {t("roomLobby.multiplayerLobby")}
                  </p>
                  <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-[2.2rem]">
                    {t("sharedGame.roomLabel", { code: normalizedCode })}
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-300">
                    {t("roomLobby.roomSubtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {currentPlayer ? (
                    <button
                      type="button"
                      onClick={() =>
                        currentPlayer.role
                          ? setShowAvatarPicker((current) => !current)
                          : undefined
                      }
                      className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-left text-white shadow-[0_10px_24px_rgba(2,6,23,0.18)] transition hover:bg-white/10"
                    >
                      <img
                        src={
                          currentPlayer.avatar ||
                          getDefaultAvatarForRole(currentPlayer.role)
                        }
                        alt={currentPlayer.display_name}
                        className="h-10 w-10 rounded-full border border-white/10 object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">
                          {currentPlayer.display_name}
                        </span>
                        <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-slate-400">
                          {currentPlayer.side && currentPlayer.role
                            ? `${currentPlayer.side === "blue" ? t("common.blueSide") : t("common.redSide")} ${
                                currentPlayer.role === "summoner"
                                  ? t("common.summoner")
                                  : `${t("gameHeader.champion")} ${(
                                      currentPlayer.slot_index ?? 0
                                    ) + 1}`
                              }`
                            : t("roomLobby.openSlot")}
                        </span>
                      </span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {copiedCode ? t("roomLobby.codeCopied") : t("roomLobby.copyRoomCode")}
                  </button>
                  {currentPlayer ? (
                    <button
                      type="button"
                      onClick={handleOpenLeaveConfirm}
                      disabled={leavingRoom}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
                    >
                      {leavingRoom ? t("common.leaving") : t("common.leaveRoom")}
                    </button>
                  ) : null}
                </div>
              </div>

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rift-banner-animated mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {successMessage}
                </div>
              ) : null}

              {!hasStoredDisplayName ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <label
                    htmlFor="lobby-display-name"
                    className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300"
                  >
                    {t("roomLobby.displayName")}
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="lobby-display-name"
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-rift-gold/55 focus:ring-2 focus:ring-rift-gold/20"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      className="rounded-2xl bg-rift-gold px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105"
                    >
                      {t("roomLobby.saveName")}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="grid gap-3 md:grid-cols-2">
                  {(["blue", "red"] as const).map((team) => {
                    const teamSlots = slotCards.filter((slot) => slot.side === team);
                    const summonerSlot = teamSlots.find((slot) => slot.role === "summoner") ?? null;
                    const championSlots = teamSlots.filter((slot) => slot.role === "champion");
                    const teamTitle = team === "blue" ? t("common.blueSide") : t("common.redSide");
                    const teamPanelClass =
                      team === "blue"
                        ? "border-blue-300/20 bg-blue-500/10"
                        : "border-red-300/20 bg-red-500/10";

                    return (
                      <section
                        key={team}
                        className={`rounded-[1.5rem] border p-3.5 shadow-[0_14px_36px_rgba(2,6,23,0.16)] ${teamPanelClass}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300/90">
                              {t("common.team")}
                            </p>
                            <h2 className="mt-1 text-lg font-black text-white sm:text-xl">
                              {teamTitle}
                            </h2>
                          </div>
                          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                            {t("roomLobby.filled", { count: teamSlots.filter((slot) =>
                              activePlayers.some(
                                (player) =>
                                  player.side === slot.side &&
                                  player.role === slot.role &&
                                  player.slot_index === slot.slotIndex,
                              ),
                            ).length })}
                          </span>
                        </div>

                        <div className="mt-3">
                          {summonerSlot ? (() => {
                            const slot = summonerSlot;
                            const occupant =
                              activePlayers.find(
                                (player) =>
                                  player.side === slot.side &&
                                  player.role === slot.role &&
                                  player.slot_index === slot.slotIndex,
                              ) ?? null;
                            const isCurrentPlayer = occupant?.id === currentPlayer?.id;
                            const isSummonerSlot = true;

                            return (
                              <div className="rounded-[1.35rem] border border-white/8 bg-black/10 p-0">
                                <div className="px-1 pb-1 pt-1">
                                  <div
                                    key={slot.key}
                                    className={`rounded-[1.15rem] border bg-black/10 transition p-4 shadow-[0_18px_44px_rgba(2,6,23,0.22),0_0_0_1px_rgba(246,196,83,0.06)] ${slot.accentClass} ${
                                      isCurrentPlayer
                                        ? "shadow-[0_0_0_1px_rgba(246,196,83,0.32),0_0_22px_rgba(246,196,83,0.12)]"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rift-gold/95">
                                          {t("roomLobby.leaderRole")}
                                        </p>
                                        <h3 className="mt-0.5 text-[17px] font-bold text-white">
                                          ★ {slot.title}
                                        </h3>
                                      </div>
                                      <span
                                        className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${slot.badgeClass}`}
                                      >
                                        {t("common.summoner")}
                                      </span>
                                    </div>

                                    {occupant ? (
                                      <div className="mt-3 flex items-center gap-3">
                                        <img
                                          src={
                                            occupant.avatar ||
                                            getDefaultAvatarForRole(occupant.role)
                                          }
                                          alt={occupant.display_name}
                                          className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-[16px] font-bold text-white">
                                              {occupant.display_name}
                                            </p>
                                            <span className="rounded-full border border-rift-gold/25 bg-rift-gold/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rift-gold">
                                              {t("roomLobby.leader")}
                                            </span>
                                            {occupant.is_host ? (
                                              <span className="rounded-full border border-rift-gold/25 bg-rift-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rift-gold">
                                                {t("roomLobby.host")}
                                              </span>
                                            ) : null}
                                            {isCurrentPlayer ? (
                                              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100">
                                                {t("roomLobby.yourSlot")}
                                              </span>
                                            ) : null}
                                          </div>
                                          <p className="mt-0.5 text-[11px] leading-4.5 text-slate-200">
                                            {t("roomLobby.callingClues")}
                                          </p>
                                          {isCurrentPlayer ? (
                                            <button
                                              type="button"
                                              onClick={() => setShowAvatarPicker(true)}
                                              className="mt-2 rounded-xl border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/12"
                                            >
                                              {t("roomLobby.changeAvatar")}
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-3 rounded-2xl border border-dashed border-rift-gold/18 bg-black/15 p-3.5">
                                        <p className="text-[16px] font-semibold text-white">
                                          {t("roomLobby.slotAvailable")}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-4.5 text-slate-200">
                                          {t("roomLobby.claimSeat")}
                                        </p>
                                        {currentPlayer ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleSelectionUpdate({
                                                side: slot.side,
                                                role: slot.role,
                                                slot_index: slot.slotIndex,
                                              })
                                            }
                                            disabled={savingSelection || !canEditSelection}
                                            className="mt-3 rounded-xl border border-rift-gold/18 bg-rift-gold/12 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-rift-gold/18 disabled:cursor-default disabled:opacity-60"
                                          >
                                            {isCurrentPlayer
                                              ? t("roomLobby.yourSlot")
                                              : t("roomLobby.joinAs", { slot: slot.title })}
                                          </button>
                                        ) : null}
                                      </div>
                                    )}

                                    {occupant && currentPlayer && occupant.id !== currentPlayer.id ? (
                                      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                                        {t("roomLobby.occupied")}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })() : null}

                          <div className="mt-5">
                            <div className="flex items-center gap-3 px-1">
                              <div className="h-px flex-1 bg-white/10" />
                              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {t("common.champions")}
                              </span>
                              <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="mt-4 grid gap-2.5">
                              {championSlots.map((slot) => {
                            const occupant =
                              activePlayers.find(
                                (player) =>
                                  player.side === slot.side &&
                                  player.role === slot.role &&
                                  player.slot_index === slot.slotIndex,
                              ) ?? null;
                            const isCurrentPlayer = occupant?.id === currentPlayer?.id;
                            const isSummonerSlot = false;

                            return (
                              <div
                                key={slot.key}
                                className={`rounded-[1.15rem] border bg-black/10 transition ${isSummonerSlot ? "p-4 shadow-[0_18px_44px_rgba(2,6,23,0.22),0_0_0_1px_rgba(246,196,83,0.06)]" : "p-3 opacity-95"} ${slot.accentClass} ${
                                  isCurrentPlayer
                                    ? "shadow-[0_0_0_1px_rgba(246,196,83,0.32),0_0_22px_rgba(246,196,83,0.12)]"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isSummonerSlot ? "text-rift-gold/95" : "text-slate-300/90"}`}>
                                      {isSummonerSlot ? t("roomLobby.leaderRole") : t("gameHeader.champion")}
                                    </p>
                                    <h3 className={`mt-0.5 font-bold text-white ${isSummonerSlot ? "text-[17px]" : "text-[15px]"}`}>
                                      {isSummonerSlot ? "★ " : ""}
                                      {slot.title}
                                    </h3>
                                  </div>
                                  <span
                                    className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${slot.badgeClass}`}
                                  >
                                    {isSummonerSlot ? t("common.summoner") : slot.teamLabel}
                                  </span>
                                </div>

                                {occupant ? (
                                  <div className="mt-3 flex items-center gap-3">
                                    <img
                                      src={
                                        occupant.avatar ||
                                        getDefaultAvatarForRole(occupant.role)
                                      }
                                      alt={occupant.display_name}
                                      className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className={`truncate font-bold text-white ${isSummonerSlot ? "text-[16px]" : "text-[15px]"}`}>
                                          {occupant.display_name}
                                        </p>
                                        {isSummonerSlot ? (
                                          <span className="rounded-full border border-rift-gold/25 bg-rift-gold/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rift-gold">
                                            {t("roomLobby.leader")}
                                          </span>
                                        ) : null}
                                        {occupant.is_host ? (
                                          <span className="rounded-full border border-rift-gold/25 bg-rift-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rift-gold">
                                            {t("roomLobby.host")}
                                          </span>
                                        ) : null}
                                        {isCurrentPlayer ? (
                                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100">
                                            {t("roomLobby.yourSlot")}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className={`mt-0.5 text-[11px] leading-4.5 ${isSummonerSlot ? "text-slate-200" : "text-slate-300"}`}>
                                        {t("roomLobby.readingBoard")}
                                      </p>
                                      {isCurrentPlayer ? (
                                        <button
                                          type="button"
                                          onClick={() => setShowAvatarPicker(true)}
                                          className="mt-2 rounded-xl border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/12"
                                        >
                                          {t("roomLobby.changeAvatar")}
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`mt-3 rounded-2xl border border-dashed bg-black/15 ${isSummonerSlot ? "border-rift-gold/18 p-3.5" : "border-white/12 p-3"}`}>
                                    <p className={`font-semibold text-white ${isSummonerSlot ? "text-[16px]" : "text-[15px]"}`}>
                                      {t("roomLobby.slotAvailable")}
                                    </p>
                                    <p className={`mt-1 text-[11px] leading-4.5 ${isSummonerSlot ? "text-slate-200" : "text-slate-300"}`}>
                                      {t("roomLobby.claimSeat")}
                                    </p>
                                    {currentPlayer ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleSelectionUpdate({
                                            side: slot.side,
                                            role: slot.role,
                                            slot_index: slot.slotIndex,
                                          })
                                        }
                                        disabled={savingSelection || !canEditSelection}
                                        className={`mt-3 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition disabled:cursor-default disabled:opacity-60 ${isSummonerSlot ? "border border-rift-gold/18 bg-rift-gold/12 hover:bg-rift-gold/18" : "bg-white/10 hover:bg-white/15"}`}
                                      >
                                        {isCurrentPlayer
                                          ? t("roomLobby.yourSlot")
                                          : t("roomLobby.joinAs", { slot: slot.title })}
                                      </button>
                                    ) : null}
                                  </div>
                                )}

                                {occupant && currentPlayer && occupant.id !== currentPlayer.id ? (
                                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                                    {t("roomLobby.occupied")}
                                  </p>
                                ) : null}
                              </div>
                            );
                              })}
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>

                <aside className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-3.5">
                  {currentPlayer?.role ? (
                    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {t("roomLobby.avatarSelection")}
                          </p>
                          <p className="mt-1 text-[11px] leading-4.5 text-slate-300">
                            {currentPlayer.role === "summoner"
                              ? t("roomLobby.summonerAvatarHelp")
                              : t("roomLobby.championAvatarHelp")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAvatarPicker((current) => !current)}
                          className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/12"
                        >
                          {showAvatarPicker ? t("roomLobby.close") : t("roomLobby.changeAvatar")}
                        </button>
                      </div>

                      {showAvatarPicker ? (
                        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                          <div className="grid grid-cols-4 gap-2">
                            {getAvatarOptionsForRole(currentPlayer.role).map((avatar) => (
                              <button
                                key={avatar}
                                type="button"
                                onClick={() =>
                                  void handleSelectionUpdate({
                                    avatar,
                                  })
                                }
                                disabled={savingSelection}
                                className={`overflow-hidden rounded-xl border transition ${
                                  currentPlayer.avatar === avatar
                                    ? "border-rift-gold shadow-[0_0_0_1px_rgba(246,196,83,0.35),0_0_20px_rgba(246,196,83,0.16)]"
                                    : "border-white/10 hover:border-white/25"
                                } disabled:cursor-default disabled:opacity-60`}
                              >
                                <img
                                  src={avatar}
                                  alt={avatar.split("/").pop() ?? "Avatar"}
                                  className="h-16 w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {spectatorPlayers.length > 0 ? (
                    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/45 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {t("roomLobby.waitingForNextGame")}
                      </p>
                      <p className="mt-1 text-[11px] leading-4.5 text-slate-300">
                        {t("roomLobby.waitingForNextGameDescription")}
                      </p>
                      <div className="mt-3 grid gap-2">
                        {spectatorPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <img
                              src={
                                player.avatar ||
                                getDefaultAvatarForRole(player.role)
                              }
                              alt={player.display_name}
                              className="h-10 w-10 rounded-xl border border-white/10 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {player.display_name}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                {player.id === currentPlayer?.id
                                  ? t("roomLobby.youAreWaiting")
                                  : t("common.waiting")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {t("roomLobby.lobbyStatus")}
                    </p>
                    <div className="mt-3 grid gap-1.5">
                      {lobbyRequirements.map((requirement) => (
                        <div
                          key={requirement.key}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[13px] ${
                            requirement.met
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                              : "border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          <span>{requirement.label}</span>
                          <span className="text-xs font-bold uppercase tracking-[0.14em]">
                            {requirement.met ? t("roomLobby.ready") : t("roomLobby.missing")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] leading-4.5 text-slate-400">
                      {activePlayers.length < 2
                        ? t("roomLobby.testingModeDescription")
                        : t("roomLobby.fillMissingDescription")}
                    </p>
                  </div>

                  {currentPlayer?.is_host ? (
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={handleRandomizeTeams}
                        disabled={randomizingTeams || !canEditSelection || assignablePlayers.length === 0}
                        className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12 disabled:cursor-default disabled:opacity-60"
                      >
                        {randomizingTeams ? t("roomLobby.randomizingTeams") : t("roomLobby.randomizeTeams")}
                      </button>
                      <button
                        type="button"
                        onClick={handleStartGame}
                        disabled={startingGame || !isLobbyValid || randomizingTeams}
                        className="rounded-2xl bg-rift-gold px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-default disabled:opacity-60"
                      >
                        {startingGame ? t("common.starting") : t("roomLobby.startGame")}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      {t("roomLobby.onlyHostLaunch")}
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <ConfirmDialog
        open={showLeaveConfirm}
        title={t("roomLobby.leaveRoomTitle")}
        message={t("roomLobby.leaveRoomMessage")}
        confirmLabel={t("common.leaveRoom")}
        cancelLabel={t("roomLobby.cancel")}
        confirming={leavingRoom}
        confirmingLabel={t("common.leaving")}
        onCancel={handleCloseLeaveConfirm}
        onConfirm={() => void handleConfirmLeaveRoom()}
      />
      </div>
    </main>
  );
}
