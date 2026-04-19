import type { Team } from "@/types/game";

type KillStreakTier = 2 | 3 | 4 | 5;

type KillStreakOverlayProps = {
  label: string;
  team: Team;
  tier: KillStreakTier;
  durationMs: number;
};

function getTeamStyles(team: Team) {
  return team === "blue"
    ? {
        container:
          "border-blue-400/30 bg-[linear-gradient(180deg,rgba(96,165,250,0.14),rgba(15,23,42,0.9))] text-blue-100",
        glow: "rift-blue-glow",
        bloom:
          "bg-[radial-gradient(circle,rgba(96,165,250,0.24),transparent_68%)]",
        shimmer:
          "bg-[linear-gradient(115deg,transparent_18%,rgba(191,219,254,0.18)_42%,transparent_62%)]",
      }
    : {
        container:
          "border-red-400/30 bg-[linear-gradient(180deg,rgba(248,113,113,0.14),rgba(15,23,42,0.9))] text-red-100",
        glow: "rift-red-glow",
        bloom:
          "bg-[radial-gradient(circle,rgba(248,113,113,0.22),transparent_68%)]",
        shimmer:
          "bg-[linear-gradient(115deg,transparent_18%,rgba(254,202,202,0.18)_42%,transparent_62%)]",
      };
}

function getTierStyles(tier: KillStreakTier) {
  if (tier === 5) {
    return {
      title: "text-[1.85rem] sm:text-[2.35rem]",
      shell: "px-7 py-3.5 sm:px-9 sm:py-4",
      bloom: "h-32 w-80 sm:h-36 sm:w-[24rem] opacity-100",
    };
  }

  if (tier === 4) {
    return {
      title: "text-[1.7rem] sm:text-[2.15rem]",
      shell: "px-6 py-3 sm:px-8 sm:py-3.5",
      bloom: "h-28 w-72 sm:h-32 sm:w-[22rem] opacity-95",
    };
  }

  if (tier === 3) {
    return {
      title: "text-[1.55rem] sm:text-[1.95rem]",
      shell: "px-5.5 py-3 sm:px-7 sm:py-3",
      bloom: "h-24 w-64 sm:h-28 sm:w-[20rem] opacity-90",
    };
  }

  return {
    title: "text-[1.4rem] sm:text-[1.8rem]",
    shell: "px-5 py-2.5 sm:px-6 sm:py-3",
    bloom: "h-20 w-56 sm:h-24 sm:w-[18rem] opacity-85",
  };
}

export function KillStreakOverlay({
  label,
  team,
  tier,
  durationMs,
}: KillStreakOverlayProps) {
  const teamStyles = getTeamStyles(team);
  const tierStyles = getTierStyles(tier);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[20%] z-30 flex justify-center px-4 sm:top-[18%]">
      <div className="relative">
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${teamStyles.bloom} ${tierStyles.bloom}`}
        />
        <div
          className={`animate-rift-kill-streak relative overflow-hidden rounded-[1.2rem] border shadow-[0_22px_70px_rgba(2,6,23,0.34)] backdrop-blur-md ${teamStyles.container} ${tierStyles.shell}`}
          style={{ animationDuration: `${durationMs}ms` }}
        >
          <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_55%)]" />
          <div
            className={`animate-rift-kill-streak-shimmer absolute inset-0 rounded-[inherit] opacity-70 ${teamStyles.shimmer}`}
            style={{ animationDuration: `${Math.max(900, durationMs - 120)}ms` }}
          />
          <p
            className={`relative whitespace-nowrap font-black uppercase tracking-[0.22em] text-white ${teamStyles.glow} ${tierStyles.title}`}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
