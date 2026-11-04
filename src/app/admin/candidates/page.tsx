import { Suspense } from "react";
import Link from "next/link";
import { FileText, PlayCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { candidateStatuses, filterCandidates, filterQuery, listCandidates, parseCandidateFilter, statusOf } from "@/lib/data/candidates";
import { readJobs } from "@/lib/data/jobs";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { AdminLoading, AdminPage, EmptyState, formatAgo, formatDate, Initials, Pill } from "@/components/admin/ui";

export const metadata = { title: "Candidates" };

export default function CandidatesPage(props: PageProps<"/admin/candidates">) {
  return (
    <Suspense fallback={<AdminLoading label="Loading candidates…" />}>
      <Candidates {...props} />
    </Suspense>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

async function Candidates({ searchParams }: PageProps<"/admin/candidates">) {
  await requireAdmin();
  const params = await searchParams;
  const filter = parseCandidateFilter(params);
  const { role, status, q } = filter;

  const redis = createRedis(readIntakeEnv());
  if (!redis) {
    return (
      <AdminPage title="Candidates">
        <EmptyState>Storage isn&apos;t configured for this environment, so there are no saved applications to show.</EmptyState>
      </AdminPage>
    );
  }
  const [all, jobs] = await Promise.all([listCandidates(redis), readJobs(redis)]);

  const byRole = filterCandidates(all, { role, status: "", q: "" });
  const counts = Object.fromEntries(candidateStatuses.map((s) => [s.value, byRole.filter((c) => statusOf(c) === s.value).length]));
  const shown = filterCandidates(all, filter);
  const query = filterQuery(filter);
  const href = (next: Partial<typeof filter>) => `/admin/candidates${filterQuery({ ...filter, ...next })}`;

  return (
    <AdminPage
      title="Candidates"
      description={`${all.length} application${all.length === 1 ? "" : "s"} saved. Applications are kept for up to 12 months, as the Privacy Policy states.`}
    >
      {params.deleted && (
        <p role="status" className="mb-6 rounded-xl bg-success-50 p-4 text-sm font-medium text-success-700 ring-1 ring-success-700/20">
          The application was permanently deleted.
        </p>
      )}

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Link href={href({ status: "" })} aria-current={!status ? "page" : undefined} className={tab(!status)}>
          All <span className="text-slate-600">{byRole.length}</span>
        </Link>
        {candidateStatuses.map((s) => (
          <Link key={s.value} href={href({ status: s.value })} aria-current={status === s.value ? "page" : undefined} className={tab(status === s.value)}>
            {s.label} <span className="text-slate-600">{counts[s.value]}</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="sm:w-72">
          <label htmlFor="f-role" className="block text-sm font-semibold text-navy-900">
            Role
          </label>
          <select id="f-role" name="role" defaultValue={role} className={field}>
            <option value="">All roles</option>
            {jobs.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.title}
                {j.status === "closed" ? " (closed)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="f-q" className="block text-sm font-semibold text-navy-900">
            Search
          </label>
          <input id="f-q" name="q" type="search" defaultValue={q} placeholder="Name, email, or location" className={field} />
        </div>
        <button type="submit" className={buttonClasses({ variant: "secondary" })}>
          Apply filters
        </button>
      </form>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState>{all.length === 0 ? "No applications yet." : "No candidates match these filters."}</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Candidates, newest first. Select a name to open the candidate.</caption>
              <thead className="border-b border-line bg-paper text-xs tracking-wide text-slate-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Candidate</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((c) => {
                  const s = statusOf(c);
                  const name = str(c.data.name) || "Unnamed";
                  const hasResume = !!(c.data.resume as { filename?: string } | undefined)?.filename;
                  const hasVideo = !!str(c.data.videoUrl);
                  return (
                    // The whole row opens the candidate: the name link stretches over it.
                    <tr key={c.id} className={cn("relative hover:bg-mist/70", s === "new" && "bg-cobalt-50/40")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Initials name={name} className="size-9 text-xs" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/candidates/${c.id}${query}`}
                              className="font-semibold text-cobalt-700 after:absolute after:inset-0 hover:underline"
                            >
                              {name}
                            </Link>
                            <div className="truncate text-slate-600">{str(c.data.email)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{str(c.data.roleTitle) || str(c.data.role)}</div>
                        <div className="mt-0.5 flex gap-2.5 text-xs text-slate-600">
                          {hasResume && (
                            <span className="inline-flex items-center gap-1">
                              <FileText aria-hidden="true" className="size-3.5" /> Résumé
                            </span>
                          )}
                          {hasVideo && (
                            <span className="inline-flex items-center gap-1">
                              <PlayCircle aria-hidden="true" className="size-3.5" /> Video
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{[str(c.data.city), str(c.data.countryName)].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3">
                        <Pill tone={s}>{candidateStatuses.find((x) => x.value === s)?.label}</Pill>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        <time dateTime={c.receivedAt} title={formatDate(c.receivedAt)}>
                          {formatAgo(c.receivedAt)}
                        </time>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPage>
  );
}

const field =
  "mt-1.5 block w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-cobalt-600 focus:ring-2 focus:ring-cobalt-600/25 focus:outline-none";
const tab = (active: boolean) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1",
    active ? "bg-navy-900 text-white ring-navy-900 [&>span]:text-slate-300" : "bg-white text-navy-900 ring-line hover:ring-cobalt-300",
  );
