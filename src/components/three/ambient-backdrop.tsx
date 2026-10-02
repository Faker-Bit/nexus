/**
 * Global page backdrop: aurora washes, a slow grid, film grain and a top glow.
 * Pure CSS/SVG - deliberately not WebGL, so the hero keeps the single GPU context.
 */
export function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-void" />

      {/* aurora blooms */}
      <div
        className="absolute -top-[22rem] left-[8%] size-[52rem] rounded-full opacity-45 blur-[120px] animate-drift"
        style={{ background: "radial-gradient(circle, rgba(0,255,157,0.30), transparent 62%)" }}
      />
      <div
        className="absolute -right-[14rem] top-[12rem] size-[44rem] rounded-full opacity-40 blur-[130px] animate-drift"
        style={{ background: "radial-gradient(circle, rgba(16,224,160,0.28), transparent 62%)", animationDelay: "-8s" }}
      />
      <div
        className="absolute bottom-[-18rem] left-[30%] size-[40rem] rounded-full opacity-25 blur-[140px] animate-drift"
        style={{ background: "radial-gradient(circle, rgba(168,255,92,0.16), transparent 65%)", animationDelay: "-14s" }}
      />

      {/* structural grid + dots */}
      <div className="grid-surface absolute inset-0 opacity-[0.55]" />
      <div className="dot-surface absolute inset-0 opacity-70" />

      {/* top hairline glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neon-400/45 to-transparent" />

      {/* grain */}
      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 55%, rgba(2,8,5,0.85) 100%)" }}
      />
    </div>
  );
}