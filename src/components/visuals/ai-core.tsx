import type { CSSProperties } from "react";
import { Bot, BookOpenText, Gauge, Plug, ShieldCheck, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { AiBackdrop } from "./ai-backdrop";

/**
 * "AI at the core": a glowing orb with data flowing out to the AI capabilities we build with. The capabilities
 * are real text (a list); the orb, rings, and lines are decorative. On small screens the chips form a grid.
 */

const capabilities: { title: string; body: string; Icon: LucideIcon; x: number; y: number }[] = [
  { title: "AI agents", body: "Take actions through permissioned tools", Icon: Bot, x: 16, y: 16 },
  { title: "Knowledge & search", body: "Answers grounded in your documents", Icon: BookOpenText, x: 84, y: 16 },
  { title: "Workflow automation", body: "Repetitive work, handled end to end", Icon: Workflow, x: 10, y: 52 },
  { title: "Evaluation", body: "Quality measured before launch", Icon: Gauge, x: 90, y: 52 },
  { title: "Human approval", body: "People sign off on what matters", Icon: ShieldCheck, x: 20, y: 88 },
  { title: "Integrations", body: "CRM, payments, e-commerce, and more", Icon: Plug, x: 80, y: 88 },
];

export function AiCore() {
  return (
    <section aria-labelledby="ai-core-heading" className="relative overflow-hidden bg-gradient-to-b from-white via-cobalt-50/70 to-white py-20 sm:py-24">
      <AiBackdrop intensity="soft" />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            <Sparkles aria-hidden="true" className="size-3.5" />
            AI at the core
          </p>
          <h2 id="ai-core-heading" className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Practical AI, <span className="text-gradient-ai">built into the work</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            {siteConfig.name} designs AI that does real jobs inside your business — measured before launch, connected to
            the tools you already use, and kept in check by people.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl lg:h-[30rem]">
          {/* Data lines from the core to each capability (desktop) */}
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 hidden size-full lg:block">
            {capabilities.map((c) => (
              <line
                key={c.title}
                x1="50"
                y1="50"
                x2={c.x}
                y2={c.y}
                stroke="#5b8bfa"
                strokeOpacity="0.55"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
              />
            ))}
          </svg>

          {/* The core */}
          <div aria-hidden="true" className="relative mx-auto flex size-56 items-center justify-center lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <div className="absolute inset-0 animate-orb rounded-full bg-gradient-to-br from-cobalt-400/60 via-violet-400/50 to-sky-300/60 blur-2xl" />
            <div className="absolute inset-4 animate-spin-slow rounded-full border border-dashed border-cobalt-400/60" />
            <div className="absolute inset-9 animate-spin-slow rounded-full border border-dashed border-violet-400/60 [animation-direction:reverse]" />
            <span className="absolute size-24 animate-pulse-ring rounded-full bg-cobalt-500/30" />
            <div className="relative flex size-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-cobalt-600 via-cobalt-700 to-violet-700 text-white shadow-float ring-4 ring-white/70">
              <Sparkles className="size-7" />
              <span className="mt-1 text-xs font-semibold tracking-wide">{siteConfig.name} AI</span>
            </div>
          </div>

          {/* Capabilities */}
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:block">
            {capabilities.map(({ title, body, Icon, x, y }, i) => (
              <li
                key={title}
                style={{ "--x": `${x}%`, "--y": `${y}%`, animationDelay: `${i * 0.8}s` } as CSSProperties}
                className="glass flex items-center gap-3 rounded-2xl p-4 lg:absolute lg:top-[var(--y)] lg:left-[var(--x)] lg:w-64 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-float"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cobalt-50 to-violet-50 text-cobalt-700 ring-1 ring-cobalt-100">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy-900">{title}</span>
                  <span className="block text-xs leading-snug text-slate-600">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
