import { getRandomBoardWordEntries, type WordPoolLocale } from "@/data/lol-terms";
import type { TranslationMessage } from "@/lib/i18n-types";
import type { CardRole, GameCard, GameStatus, Team } from "@/types/game";
import type { SharedGameState } from "@/types/lobby";

const GRID_SIZE = 25;

const rolePool: CardRole[] = [
  ...Array(8).fill("blue"),
  ...Array(8).fill("red"),
  ...Array(7).fill("neutral"),
  "assassin",
];

const blueImages = [
  "cannon_blue.png",
  "mage_blue.png",
  "melee_blue2.png",
  "melee_blue.png",
  "super_blue.webp",
] as const;

const redImages = [
  "cannon_red.png",
  "mage_red.png",
  "red_melee.webp",
  "red_melee2.png",
  "super_red.webp",
  "super_red2.png",
] as const;

function shuffle<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
}

export function createNewGame(locale: WordPoolLocale = "en"): GameCard[] {
  const selectedWords = getRandomBoardWordEntries(GRID_SIZE, locale);
  const selectedRoles = shuffle(rolePool);

  return selectedWords.map((entry, index) => ({
    id: `${entry.word}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    word: entry.word,
    role: selectedRoles[index],
    revealed: false,
    revealedImage: null,
  }));
}

function getRandomRevealedImage(role: CardRole) {
  if (role === "blue") {
    const randomFile = blueImages[Math.floor(Math.random() * blueImages.length)];
    return randomFile ? `/cinematics/minions/Blue/${randomFile}` : null;
  }

  if (role === "red") {
    const randomFile = redImages[Math.floor(Math.random() * redImages.length)];
    return randomFile ? `/cinematics/minions/Red/${randomFile}` : null;
  }

  return null;
}

function getSideLabelKey(team: Team): "common.blueSide" | "common.redSide" {
  return team === "blue" ? "common.blueSide" : "common.redSide";
}

function createMessage(
  key: string,
  values?: TranslationMessage["values"],
): TranslationMessage {
  return { key, values };
}

export function revealCard(cards: GameCard[], cardId: string): GameCard[] {
  return cards.map((card) =>
    card.id === cardId
      ? (() => {
          const selectedImage =
            card.revealedImage ?? getRandomRevealedImage(card.role);

          console.log("revealedImage:", selectedImage);

          return {
            ...card,
            revealed: true,
            revealedImage: selectedImage || null,
          };
        })()
      : card,
  );
}

export function getRevealedCount(cards: GameCard[], role: CardRole): number {
  return cards.filter((card) => card.role === role && card.revealed).length;
}

export function getRemainingCount(cards: GameCard[], team: Team): number {
  const teamTotal = rolePool.filter((role) => role === team).length;
  return teamTotal - getRevealedCount(cards, team);
}

export function getNextTeam(team: Team): Team {
  return team === "blue" ? "red" : "blue";
}

export function getRandomStartingTeam(): Team {
  return Math.random() < 0.5 ? "blue" : "red";
}

export function createInitialStatus(startingTeam: Team = "blue"): GameStatus {
  return {
    activeTeam: startingTeam,
    winner: null,
    loser: null,
    gameOver: false,
    endReason: null,
    message: createMessage("messages.localStartReveal", {
      team: getSideLabelKey(startingTeam),
    }),
  };
}

export function createInitialSharedGameState(
  locale: WordPoolLocale = "en",
): SharedGameState {
  const activeSide = getRandomStartingTeam();

  return {
    status: "playing",
    cards: createNewGame(locale),
    activeSide,
    startingSide: activeSide,
    startingSideBonusUsed: false,
    currentSignal: null,
    picksRemaining: null,
    gameOver: false,
    winner: null,
    loser: null,
    endReason: null,
    message: createMessage("messages.sharedStartWaiting", {
      team: getSideLabelKey(activeSide),
    }),
  };
}

export function submitSharedSignal(
  gameState: SharedGameState,
  clue: { word: string; number: number },
): SharedGameState {
  if (gameState.status === "finished") {
    return gameState;
  }

  const getsStartingSideBonus =
    gameState.activeSide === gameState.startingSide &&
    !gameState.startingSideBonusUsed;
  const picksRemaining = clue.number + (getsStartingSideBonus ? 2 : 1);

  return {
    ...gameState,
    currentSignal: clue,
    picksRemaining,
    startingSideBonusUsed: gameState.startingSideBonusUsed || getsStartingSideBonus,
    message: createMessage("messages.sharedSignalSent", {
      team: getSideLabelKey(gameState.activeSide),
      word: clue.word,
      number: clue.number,
    }),
  };
}

export function endSharedTurn(gameState: SharedGameState): SharedGameState {
  if (gameState.status === "finished") {
    return gameState;
  }

  const nextSide = getNextTeam(gameState.activeSide);

  return {
    ...gameState,
    activeSide: nextSide,
    currentSignal: null,
    picksRemaining: null,
    message: createMessage("messages.teamTurn", {
      team: getSideLabelKey(nextSide),
    }),
  };
}

export function revealSharedGameCard(
  gameState: SharedGameState,
  cardId: string,
): SharedGameState {
  if (gameState.gameOver || gameState.status === "finished") {
    return gameState;
  }

  const targetCard = gameState.cards.find((card) => card.id === cardId);
  if (!targetCard || targetCard.revealed) {
    return gameState;
  }

  const updatedCards = revealCard(gameState.cards, cardId);
  const activeSide = gameState.activeSide;
  const opposingSide = getNextTeam(activeSide);
  const nextPicksRemaining =
    gameState.picksRemaining !== null
      ? Math.max(gameState.picksRemaining - 1, 0)
      : null;
  const remainingBlue = getRemainingCount(updatedCards, "blue");
  const remainingRed = getRemainingCount(updatedCards, "red");

  if (targetCard.role === "assassin") {
    return {
      ...gameState,
      status: "finished",
      cards: updatedCards,
      gameOver: true,
      winner: opposingSide,
      loser: activeSide,
      endReason: "gank",
      message: createMessage("messages.gotGanked", {
        team: getSideLabelKey(activeSide),
      }),
      currentSignal: null,
      picksRemaining: null,
    };
  }

  if (remainingBlue === 0) {
    return {
      ...gameState,
      status: "finished",
      cards: updatedCards,
      gameOver: true,
      winner: "blue",
      loser: "red",
      endReason: "victory",
      message: createMessage("messages.blueWins"),
      currentSignal: null,
      picksRemaining: null,
    };
  }

  if (remainingRed === 0) {
    return {
      ...gameState,
      status: "finished",
      cards: updatedCards,
      gameOver: true,
      winner: "red",
      loser: "blue",
      endReason: "victory",
      message: createMessage("messages.redWins"),
      currentSignal: null,
      picksRemaining: null,
    };
  }

  if (targetCard.role === activeSide) {
    if (nextPicksRemaining === 0) {
      return {
        ...gameState,
        cards: updatedCards,
        activeSide: opposingSide,
        currentSignal: null,
        picksRemaining: null,
        message: createMessage("messages.usedLastPick", {
          team: getSideLabelKey(activeSide),
          nextTeam: getSideLabelKey(opposingSide),
        }),
      };
    }

    return {
      ...gameState,
      cards: updatedCards,
      picksRemaining: nextPicksRemaining,
      message: createMessage("messages.foundCorrectCard", {
        team: getSideLabelKey(activeSide),
      }),
    };
  }

  if (targetCard.role === "neutral") {
    return {
      ...gameState,
      cards: updatedCards,
      activeSide: opposingSide,
      currentSignal: null,
      picksRemaining: null,
      message: createMessage("messages.neutralCard", {
        nextTeam: getSideLabelKey(opposingSide),
      }),
    };
  }

  return {
    ...gameState,
    cards: updatedCards,
    activeSide: opposingSide,
    currentSignal: null,
    picksRemaining: null,
    message: createMessage("messages.revealedOpponentCard", {
      revealedTeam: getSideLabelKey(targetCard.role as Team),
      nextTeam: getSideLabelKey(opposingSide),
    }),
  };
}
