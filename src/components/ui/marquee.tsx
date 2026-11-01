import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An endlessly scrolling row of short labels. Screen readers get the list once; the duplicate copy that makes
 * the loop seamless is hidden from them. Pauses on hover; stills under prefers-reduced-motion.
 */
export function Marquee({ items, label, className }: { items: string[]; label: string; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} aria-label={hidden ? undefined : label} className="flex shrink-0 items-center gap-3 pr-3">
      {items.map((item) => (
        <li key={item} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-navy-800">
          <Sparkles aria-hidden="true" className="size-3.5 text-cobalt-600" />
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("mask-fade-x group overflow-hidden", className)}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
