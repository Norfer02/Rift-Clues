import { GameCardTile } from "@/components/game-card-tile";
import type { GameCard, ViewMode } from "@/types/game";

type GameBoardProps = {
  cards: GameCard[];
  viewMode: ViewMode;
  onReveal: (cardId: string) => void;
  locked: boolean;
  waitingForSignal?: boolean;
  successHighlightCardId?: string | null;
};

export function GameBoard({
  cards,
  viewMode,
  onReveal,
  locked,
  waitingForSignal = false,
  successHighlightCardId = null,
}: GameBoardProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-w-0 items-stretch justify-center">
      <div className="rift-board-enter grid h-full max-h-[calc(100dvh-22rem)] w-full min-w-0 grid-cols-5 grid-rows-5 gap-1.5 sm:max-h-[calc(100dvh-20rem)] sm:gap-2 md:gap-2.5 lg:max-h-[calc(100dvh-18.5rem)] lg:gap-3">
      {cards.map((card) => (
        <GameCardTile
          key={card.id}
          card={card}
          viewMode={viewMode}
          locked={locked}
          waitingForSignal={waitingForSignal}
          successHighlight={successHighlightCardId === card.id}
          onReveal={() => onReveal(card.id)}
        />
      ))}
      </div>
    </div>
  );
}
