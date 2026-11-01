import { cn } from "@/lib/utils";

/**
 * Animated "AI" backdrop: silk ribbons made of many fine sine strands, plus soft glowing orbs.
 * Pure SVG/CSS, animated with transforms only (GPU-friendly); stills itself under prefers-reduced-motion.
 * Decorative — always aria-hidden.
 */

// Each strand is a smooth wave; small offsets between strands give the silky ribbon look.
function strand(i: number, baseY: number, amp: number, phase: number) {
  const y = baseY + i * 3.2;
  const a = amp + i * 1.4;
  const p = phase + i * 6;
  return `M -200 ${y} C ${150 + p} ${y - a}, ${450 + p} ${y + a}, ${800 + p} ${y} S ${1350 + p} ${y - a}, ${1800} ${y + a * 0.4}`;
}

const ribbons = [
  { id: "a", baseY: 330, amp: 120, phase: 0, strands: 16, from: "#5b8bfa", to: "#8b5cf6", opacity: 0.32, delay: "0s" },
  { id: "b", baseY: 400, amp: 90, phase: 120, strands: 12, from: "#38bdf8", to: "#1256ed", opacity: 0.22, delay: "-6s" },
];

export function AiBackdrop({ className, intensity = "full" }: { className?: string; intensity?: "full" | "soft" }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Glowing orbs */}
      <div className="absolute -top-32 -left-24 size-[28rem] animate-orb rounded-full bg-cobalt-300/40 blur-3xl" />
      <div className="absolute top-1/4 -right-32 size-[30rem] animate-orb rounded-full bg-violet-300/35 blur-3xl [animation-delay:-5s]" />
      {intensity === "full" && (
        <div className="absolute -bottom-40 left-1/3 size-[26rem] animate-orb rounded-full bg-sky-200/50 blur-3xl [animation-delay:-9s]" />
      )}

      {/* Silk ribbons */}
      <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-x-[-10%] top-[8%] h-[92%] w-[120%]">
        <defs>
          {ribbons.map((r) => (
            <linearGradient key={r.id} id={`ai-ribbon-${r.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={r.from} stopOpacity="0" />
              <stop offset="0.3" stopColor={r.from} />
              <stop offset="0.7" stopColor={r.to} />
              <stop offset="1" stopColor={r.to} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ribbons.map((r) => (
          <g
            key={r.id}
            className="origin-center animate-ribbon"
            style={{ animationDelay: r.delay, opacity: intensity === "soft" ? r.opacity * 0.6 : r.opacity }}
          >
            {Array.from({ length: r.strands }, (_, i) => (
              <path key={i} d={strand(i, r.baseY, r.amp, r.phase)} fill="none" stroke={`url(#ai-ribbon-${r.id})`} strokeWidth={1.4} />
            ))}
          </g>
        ))}
      </svg>

      {/* Dotted grid, fading out */}
      <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
    </div>
  );
}
