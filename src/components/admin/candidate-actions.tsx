"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, LoaderCircle, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteCandidateAction, saveCandidateReviewAction, type ReviewState } from "@/app/admin/actions";
import type { CandidateStatus } from "@/lib/data/candidates";

type Option = { value: string; label: string };

const statusTones: Record<string, string> = {
  new: "peer-checked:bg-cobalt-600 peer-checked:text-white peer-checked:ring-cobalt-600",
  reviewing: "peer-checked:bg-amber-700 peer-checked:text-white peer-checked:ring-amber-700",
  interview: "peer-checked:bg-violet-700 peer-checked:text-white peer-checked:ring-violet-700",
  offer: "peer-checked:bg-emerald-700 peer-checked:text-white peer-checked:ring-emerald-700",
  hired: "peer-checked:bg-emerald-800 peer-checked:text-white peer-checked:ring-emerald-800",
  rejected: "peer-checked:bg-slate-700 peer-checked:text-white peer-checked:ring-slate-700",
};

/**
 * Status and private notes. Choosing a status saves it at once (with the notes as they are); notes have their own
 * Save button. No automatic form reset, so notes being written are never cleared by a save or an error.
 */
export function ReviewForm({ id, status, notes, statuses }: { id: string; status: CandidateStatus; notes: string; statuses: readonly Option[] }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveCandidateReviewAction.bind(null, id), {});
  const formRef = useRef<HTMLFormElement>(null);
  const save = () => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    startTransition(() => action(data));
  };
  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    save();
  };
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Status</legend>
        <p className="mt-0.5 text-xs text-slate-600">Saved as soon as you choose.</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <label key={s.value} className="cursor-pointer">
              <input type="radio" name="status" value={s.value} defaultChecked={s.value === status} onChange={save} className="peer sr-only" />
              <span
                className={cn(
                  "inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-navy-900 ring-1 ring-line transition-colors peer-hover:ring-cobalt-300 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt-600",
                  statusTones[s.value],
                )}
              >
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="review-notes" className="block text-sm font-semibold text-navy-900">
          Private notes
        </label>
        <textarea id="review-notes" name="notes" rows={7} maxLength={5000} defaultValue={notes} className={field} />
        <p className="mt-1 text-xs text-slate-600">Visible to admins only. Keep notes factual and job-related.</p>
      </div>
      <div className="flex min-h-11 items-center gap-3" aria-live="polite">
        <button type="submit" disabled={pending} className={buttonClasses({ variant: "secondary" })}>
          {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          Save notes
        </button>
        {pending && <span className="text-sm text-slate-600">Saving…</span>}
        {state.saved && !pending && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-success-700">
            <CircleCheck aria-hidden="true" className="size-4" /> Saved
          </span>
        )}
        {state.error && <span className="text-sm text-danger-700">{state.error}</span>}
      </div>
    </form>
  );
}

/** Previous/next candidate within the current list filter; ← and → (or K and J) work too, except while typing. */
export function CandidatePager({ prevHref, nextHref, position, total }: { prevHref: string | null; nextHref: string | null; position: number; total: number }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.key === "ArrowLeft" || e.key === "k") && prevHref) router.push(prevHref);
      if ((e.key === "ArrowRight" || e.key === "j") && nextHref) router.push(nextHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  const arrow = "inline-flex size-10 items-center justify-center rounded-xl ring-1 ring-line bg-white text-navy-900";
  return (
    <nav aria-label="Candidates" className="flex items-center gap-2">
      {prevHref ? (
        <Link href={prevHref} className={cn(arrow, "hover:ring-cobalt-300")} title="Previous candidate (←)">
          <ChevronLeft aria-hidden="true" className="size-5" />
          <span className="sr-only">Previous candidate</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(arrow, "opacity-40")}>
          <ChevronLeft className="size-5" />
        </span>
      )}
      <span className="min-w-16 text-center text-sm text-slate-600">
        {position} of {total}
      </span>
      {nextHref ? (
        <Link href={nextHref} className={cn(arrow, "hover:ring-cobalt-300")} title="Next candidate (→)">
          <ChevronRight aria-hidden="true" className="size-5" />
          <span className="sr-only">Next candidate</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(arrow, "opacity-40")}>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}

export function DeleteCandidateButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCandidateAction.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Permanently delete ${name}'s application and résumé? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClasses({ variant: "ghost", className: "text-danger-700 hover:bg-danger-50" })}>
        <Trash2 aria-hidden="true" className="size-4" />
        Delete application
      </button>
    </form>
  );
}

const field =
  "mt-1.5 block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/25 focus:outline-none";
