import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText, Mail, Phone, PlayCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { candidateStatuses, filterCandidates, filterQuery, getCandidate, listCandidates, parseCandidateFilter, statusOf } from "@/lib/data/candidates";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";
import { ageRangeOptions, genderOptions } from "@/lib/validation/job-application";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { AdminLoading, formatAgo, formatDate, Initials, Panel, Pill } from "@/components/admin/ui";
import { CandidatePager, DeleteCandidateButton, ReviewForm } from "@/components/admin/candidate-actions";

export const metadata = { title: "Candidate" };

export default function CandidatePage(props: PageProps<"/admin/candidates/[id]">) {
  return (
    <Suspense fallback={<AdminLoading label="Loading candidate…" />}>
      <CandidateDetail {...props} />
    </Suspense>
  );
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const https = (v: unknown) => (/^https:\/\//i.test(str(v)) ? str(v) : "");
const label = (opts: readonly { value: string; label: string }[], v: unknown) =>
  !v || v === "decline" ? "Not disclosed" : (opts.find((o) => o.value === v)?.label ?? str(v));
const kb = (n: unknown) => (typeof n === "number" ? (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`) : "");

/** Only https links are rendered as links (they were validated on submit; this is defense in depth). */
function SafeLink({ href }: { href: string }) {
  if (!/^https:\/\//i.test(href)) return <span>{href || "—"}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all font-medium text-cobalt-700 underline underline-offset-2">
      {href}
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function QuickLink({ href, icon, children, external }: { href: string; icon: ReactNode; children: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
      className={buttonClasses({ variant: "secondary", className: "min-h-10 px-4" })}
    >
      {icon}
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

async function CandidateDetail({ params, searchParams }: PageProps<"/admin/candidates/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const redis = createRedis(readIntakeEnv());
  if (!redis) notFound();
  const [c, all] = await Promise.all([getCandidate(redis, id), listCandidates(redis)]);
  if (!c) notFound();

  // Previous/next follow the list the admin came from (same filter, same order).
  const filter = parseCandidateFilter(sp);
  const query = filterQuery(filter);
  const list = filterCandidates(all, filter);
  const index = list.findIndex((x) => x.id === c.id);
  const neighbour = (i: number) => (list[i] ? `/admin/candidates/${list[i]!.id}${query}` : null);

  const d = c.data;
  const name = str(d.name) || "Unnamed candidate";
  const status = statusOf(c);
  const role = str(d.roleTitle) || str(d.role);
  const location = [str(d.city), str(d.countryName) || str(d.country)].filter(Boolean).join(", ");
  const resume = d.resume as { filename?: string; size?: number; contentType?: string } | undefined;
  const isPdf = !!resume?.filename && (resume.contentType === "application/pdf" || /\.pdf$/i.test(resume.filename));
  const email = str(d.email);
  const phone = str(d.phone);

  const details: [string, ReactNode][] = [
    ["Email", email ? <a key="e" href={`mailto:${email}`} className="font-medium text-cobalt-700 underline underline-offset-2">{email}</a> : "—"],
    ["Phone", phone ? <a key="p" href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-medium text-cobalt-700 underline underline-offset-2">{phone}</a> : "—"],
    ["Location", location || "—"],
    ["LinkedIn", <SafeLink key="l" href={str(d.linkedinUrl)} />],
    ["Introduction video", str(d.videoUrl) ? <SafeLink key="v" href={str(d.videoUrl)} /> : "Not provided"],
    ["Portfolio / GitHub", str(d.portfolioUrl) ? <SafeLink key="g" href={str(d.portfolioUrl)} /> : "—"],
    ["Gender", label(genderOptions, d.gender)],
    ["Age range", label(ageRangeOptions, d.ageRange)],
    ["Received", formatDate(c.receivedAt)],
  ];

  return (
    <Container className="py-6 sm:py-8">
      {/* Top bar: back to the list (keeping its filter) and previous/next */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/candidates${query}`} className={buttonClasses({ variant: "ghost", className: "-ml-3" })}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          All candidates
        </Link>
        {index >= 0 && <CandidatePager prevHref={neighbour(index - 1)} nextHref={neighbour(index + 1)} position={index + 1} total={list.length} />}
      </div>

      {/* Candidate header */}
      <Panel className="mt-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Initials name={name} className="size-14 text-lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                <Pill tone={status}>{candidateStatuses.find((s) => s.value === status)?.label}</Pill>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium text-navy-900">{role}</span>
                {location && <> · {location}</>} · <time dateTime={c.receivedAt} title={formatDate(c.receivedAt)}>Applied {formatAgo(c.receivedAt).toLowerCase()}</time>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {email && <QuickLink href={`mailto:${email}`} icon={<Mail aria-hidden="true" className="size-4" />}>Email</QuickLink>}
            {phone && <QuickLink href={`tel:${phone.replace(/[^\d+]/g, "")}`} icon={<Phone aria-hidden="true" className="size-4" />}>Call</QuickLink>}
            {https(d.linkedinUrl) && (
              <QuickLink href={https(d.linkedinUrl)} external icon={<ExternalLink aria-hidden="true" className="size-4" />}>
                LinkedIn
              </QuickLink>
            )}
            {https(d.videoUrl) && (
              <QuickLink href={https(d.videoUrl)} external icon={<PlayCircle aria-hidden="true" className="size-4" />}>
                Video
              </QuickLink>
            )}
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Résumé first: it's what you read */}
        <div className="space-y-6 lg:col-span-8">
          <section aria-labelledby="resume-heading" className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <h2 id="resume-heading" className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                <FileText aria-hidden="true" className="size-5 text-cobalt-600" />
                Résumé
                {resume?.filename && (
                  <span className="text-sm font-normal text-slate-600">
                    {resume.filename} · {kb(resume.size)}
                  </span>
                )}
              </h2>
              {resume?.filename && (
                <div className="flex gap-2">
                  {isPdf && (
                    <a href={`/admin/candidates/${c.id}/resume/view`} target="_blank" rel="noopener" className={buttonClasses({ variant: "ghost" })}>
                      <ExternalLink aria-hidden="true" className="size-4" />
                      Open in new tab
                    </a>
                  )}
                  {/* A plain link (not next/link): it's a file download from a route handler. */}
                  <a href={`/admin/candidates/${c.id}/resume`} className={buttonClasses()}>
                    <Download aria-hidden="true" className="size-4" />
                    Download
                  </a>
                </div>
              )}
            </div>
            {resume?.filename ? (
              isPdf ? (
                <iframe
                  src={`/admin/candidates/${c.id}/resume/view#view=FitH`}
                  title={`Résumé of ${name}`}
                  className="block h-[78vh] min-h-[32rem] w-full bg-paper"
                />
              ) : (
                <div className="px-6 py-12 text-center">
                  <FileText aria-hidden="true" className="mx-auto size-10 text-slate-400" />
                  <p className="mt-3 font-medium text-navy-900">Word documents can&apos;t be shown in the browser.</p>
                  <p className="mt-1 text-sm text-slate-600">Download the file to read it.</p>
                </div>
              )
            ) : (
              <p className="px-6 py-10 text-center text-sm text-slate-600">
                {str(d.resumeUrl) ? <SafeLink href={str(d.resumeUrl)} /> : "No résumé file on this application."}
              </p>
            )}
          </section>

          {str(d.introduction) && (
            <Panel>
              <h2 className="text-lg font-semibold">Introduction</h2>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{str(d.introduction)}</p>
            </Panel>
          )}
        </div>

        {/* Review and details stay in view while reading */}
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-6">
            <Panel>
              <h2 className="text-lg font-semibold">Review</h2>
              <div className="mt-4">
                <ReviewForm key={c.id} id={c.id} status={status} notes={c.review?.notes ?? ""} statuses={candidateStatuses} />
              </div>
              {c.review && (
                <p className="mt-4 text-xs text-slate-600">
                  Last updated {formatDate(c.review.updatedAt)} by {c.review.updatedBy}
                </p>
              )}
            </Panel>

            <Panel>
              <h2 className="text-lg font-semibold">Details</h2>
              <dl className="mt-3 divide-y divide-line">
                {details.map(([k, v]) => (
                  <div key={k} className="py-2.5">
                    <dt className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{k}</dt>
                    <dd className="mt-0.5 text-sm break-words text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel>
              <h2 className="text-base font-semibold">Delete</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Use when a candidate asks for their data to be removed. Permanently deletes the application, résumé, and notes.
              </p>
              <div className="mt-2">
                <DeleteCandidateButton id={c.id} name={name} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Container>
  );
}
