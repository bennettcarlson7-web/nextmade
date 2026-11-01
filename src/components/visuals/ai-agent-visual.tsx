"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ListChecks, Plug, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero animation: an AI agent working through one task from each NextMade product, on a loop —
 * request → reasoning steps → streamed answer → proposed actions awaiting approval.
 *
 * Honest by construction: it is captioned as an illustration of products in development, sample data is
 * fictional, and every action ends in human approval. Decorative for assistive tech (the caption carries it).
 * Pauses off screen and in background tabs; shows a still, finished frame when reduced motion is preferred.
 */

type Scenario = { product: string; request: string; steps: string[]; answer: string; actions: string[] };

const scenarios: Scenario[] = [
  {
    product: "ClientFlow AI",
    request: "New inquiry from Northwind Dental. Can you qualify it?",
    steps: ["Read the inquiry", "Extract budget and timeline", "Score the fit"],
    answer: "Qualified lead: online booking for 3 clinics, about $10–15k, launch in 8 weeks. Next step: book a discovery call.",
    actions: ["Added to pipeline", "Reply drafted for approval"],
  },
  {
    product: "CommercePilot AI",
    request: "Customer asks: “Where is my order #5531?”",
    steps: ["Classify the request", "Look up the Shopify order", "Check the shipping policy"],
    answer: "Order #5531 shipped Oct 28 and arrives Nov 1. Tracking link added to the drafted reply.",
    actions: ["Order found", "Waiting for agent approval"],
  },
  {
    product: "FieldOps AI",
    request: "Water-heater install, Tuesday 2 pm. Who should go?",
    steps: ["Check skills and certifications", "Compare travel times", "Check availability"],
    answer: "Assign Lena S.: certified, 12 minutes away, and free from 1:30 pm.",
    actions: ["Schedule suggestion ready", "Dispatcher approves"],
  },
];

type Frame = { scenario: number; steps: number; typed: number; actions: number; thinking: boolean };
const finished = (scenario: number): Frame => ({
  scenario,
  steps: scenarios[scenario]!.steps.length,
  typed: scenarios[scenario]!.answer.length,
  actions: scenarios[scenario]!.actions.length,
  thinking: false,
});

export function AiAgentVisual() {
  const ref = useRef<HTMLDivElement>(null);
  // Server render and no-JS visitors see a finished first scenario; the loop starts from there.
  const [frame, setFrame] = useState<Frame>(finished(0));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    let visible = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current = finished(0);

    const set = (f: Frame) => {
      current = f;
      setFrame(f);
    };
    // Advance one tick of the script; returns the delay before the next tick.
    const tick = (): number => {
      const s = scenarios[current.scenario]!;
      if (current.actions === s.actions.length && current.typed === s.answer.length) {
        const next = (current.scenario + 1) % scenarios.length;
        set({ scenario: next, steps: 0, typed: 0, actions: 0, thinking: true });
        return 900;
      }
      if (current.steps < s.steps.length) {
        set({ ...current, steps: current.steps + 1 });
        return 650;
      }
      if (current.thinking) {
        set({ ...current, thinking: false });
        return 250;
      }
      if (current.typed < s.answer.length) {
        set({ ...current, typed: Math.min(s.answer.length, current.typed + 2) });
        return 28;
      }
      set({ ...current, actions: current.actions + 1 });
      return current.actions + 1 === s.actions.length ? 3800 : 500;
    };
    const run = () => {
      timer = undefined;
      if (!visible || document.hidden) return;
      timer = setTimeout(run, tick());
    };
    const resume = () => {
      if (visible && !document.hidden && !timer) timer = setTimeout(run, 400);
    };

    const io = el
      ? new IntersectionObserver(([entry]) => {
          visible = !!entry?.isIntersecting;
          if (visible) resume();
        })
      : undefined;
    if (el && io) io.observe(el);
    document.addEventListener("visibilitychange", resume);
    timer = setTimeout(run, 2600); // let visitors read the first, finished frame
    return () => {
      if (timer) clearTimeout(timer);
      io?.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  const s = scenarios[frame.scenario]!;
  const typing = frame.typed > 0 && frame.typed < s.answer.length;

  return (
    <figure ref={ref} className="relative mx-auto w-full max-w-xl select-none lg:max-w-none">
      <div aria-hidden="true" className="relative">
        {/* Glow behind the window */}
        <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-cobalt-400/40 via-violet-400/30 to-sky-300/40 blur-2xl" />

        <div className="glass relative overflow-hidden rounded-[1.75rem]">
          {/* Title bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/70 bg-white/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cobalt-600 to-violet-700 text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p key={s.product} className="animate-pop text-sm font-semibold text-navy-900">
                  {s.product}
                </p>
                <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-success-700">
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success-700" />
                    <span className="relative size-1.5 rounded-full bg-success-700" />
                  </span>
                  AI agent running
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[19.5rem] space-y-3 p-4 pb-14 sm:min-h-[18.5rem] sm:p-5 sm:pb-14">
            {/* Request */}
            <div key={`req-${frame.scenario}`} className="ml-auto max-w-[85%] animate-pop rounded-2xl rounded-tr-md bg-navy-900 px-3.5 py-2.5 text-sm text-white">
              {s.request}
            </div>

            {/* Reasoning steps */}
            <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-line">
              <p className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                {frame.thinking ? (
                  <>
                    Thinking
                    <span className="inline-flex gap-0.5">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-1 animate-dot rounded-full bg-cobalt-600" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5 text-success-700" /> Reasoned in {s.steps.length} steps
                  </>
                )}
              </p>
              <ul className="mt-2 space-y-1.5">
                {s.steps.map((step, i) => (
                  <li key={step} className={cn("flex items-center gap-2 text-xs", i < frame.steps ? "text-slate-700" : "invisible")}>
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-cobalt-50 text-cobalt-700">
                      <Check className="size-2.5" />
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Streamed answer */}
            <div className={cn("rounded-2xl rounded-tl-md bg-gradient-to-br from-cobalt-50 to-violet-50 px-3.5 py-2.5 ring-1 ring-cobalt-100", frame.typed === 0 && "invisible")}>
              <p className="text-sm leading-relaxed text-navy-900">
                {s.answer.slice(0, frame.typed)}
                {typing && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-blink bg-cobalt-600" />}
              </p>
            </div>

            {/* Proposed actions */}
            <div className="flex min-h-7 flex-wrap gap-2">
              {s.actions.slice(0, frame.actions).map((a, i) => (
                <span
                  key={`${frame.scenario}-${a}`}
                  className={cn(
                    "inline-flex animate-pop items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    i === s.actions.length - 1 ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200" : "bg-success-50 text-success-700 ring-1 ring-success-700/20",
                  )}
                >
                  {i === s.actions.length - 1 ? <ShieldCheck className="size-3.5" /> : <Check className="size-3.5" />}
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating chips */}
        <Chip Icon={ShieldCheck} title="Human approval" body="People sign off" className="-top-6 -right-2 sm:-right-5" delay="0s" />
        <Chip Icon={ListChecks} title="Every action logged" body="Full audit trail" className="-bottom-7 left-3 sm:left-6" delay="1.4s" />
        <Chip Icon={Plug} title="Connected tools" body="CRM · Shopify · Calendar" className="-right-2 -bottom-7 hidden sm:flex sm:right-6" delay="2.8s" />
      </div>
      <figcaption className="mt-12 text-center text-xs text-slate-600 lg:text-left">
        Illustration of how our AI products are designed to work. They&apos;re in development; sample data is fictional.
      </figcaption>
    </figure>
  );
}

function Chip({ Icon, title, body, className, delay }: { Icon: LucideIcon; title: string; body: string; className: string; delay: string }) {
  return (
    <div style={{ animationDelay: delay }} className={cn("glass absolute flex animate-float items-center gap-2.5 rounded-2xl px-3 py-2.5", className)}>
      <span className="inline-flex size-8 items-center justify-center rounded-xl bg-cobalt-50 text-cobalt-700">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-xs font-semibold text-navy-900">{title}</span>
        <span className="block text-[0.7rem] text-slate-600">{body}</span>
      </span>
    </div>
  );
}
