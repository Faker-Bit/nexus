export function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-9";
  const icon = size === "sm" ? "size-4" : size === "lg" ? "size-6.5" : "size-5";
  return (
    <span className={`relative grid ${dims} place-items-center rounded-xl bg-linear-to-br from-neon-300 via-neon-400 to-violet-neon shadow-[0_0_22px_-6px] shadow-neon-400/80`}>
      <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
      <svg viewBox="0 0 24 24" className={`${icon} text-void`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M4 20V4l16 16V4" />
      </svg>
    </span>
  );
}