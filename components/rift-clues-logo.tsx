type RiftCluesLogoProps = {
  className?: string;
  compact?: boolean;
};

export function RiftCluesLogo({
  className = "",
  compact = false,
}: RiftCluesLogoProps) {
  const sizeClass = compact
    ? "w-[9.5rem] sm:w-[11rem] lg:w-[12.5rem]"
    : "w-[11.5rem] sm:w-[13.5rem] lg:w-[15rem]";

  return (
    <div
      className={`pointer-events-none mx-auto flex w-full justify-center ${className}`}
      aria-hidden="true"
    >
      <img
        src="/cinematics/rift_clues_logo_top_right.png"
        alt="Rift Clues"
        className={`animate-rift-logo-glow h-auto ${sizeClass} select-none object-contain drop-shadow-[0_10px_30px_rgba(15,23,42,0.38)]`}
      />
    </div>
  );
}
