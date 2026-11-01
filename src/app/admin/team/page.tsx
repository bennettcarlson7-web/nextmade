import { Suspense } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { teamGroups } from "@/content/team";
import { requireAdmin } from "@/lib/admin/session";
import { adminPhoto, readTeam } from "@/lib/data/team";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";
import { buttonClasses } from "@/components/ui/button";
import { TeamAvatar } from "@/components/team/team-card";
import { AdminLoading, AdminPage, EmptyState, Pill } from "@/components/admin/ui";
import { DeleteMemberButton } from "@/components/admin/team-actions";
import { moveMemberAction, setMemberVisibleAction } from "../actions";

export const metadata = { title: "Team" };

export default function TeamPage(props: PageProps<"/admin/team">) {
  return (
    <Suspense fallback={<AdminLoading label="Loading team…" />}>
      <Team {...props} />
    </Suspense>
  );
}

async function Team({ searchParams }: PageProps<"/admin/team">) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const redis = createRedis(readIntakeEnv());
  if (!redis) {
    return (
      <AdminPage title="Team">
        <EmptyState>Storage isn&apos;t configured for this environment, so the team can&apos;t be edited here.</EmptyState>
      </AdminPage>
    );
  }
  const members = await readTeam(redis);

  return (
    <AdminPage
      title="Team"
      description="Team profiles shown on the About, Careers, and home pages. Changes appear on the website within seconds."
      actions={
        <Link href="/admin/team/new" className={buttonClasses()}>
          <Plus aria-hidden="true" className="size-4" />
          Add team member
        </Link>
      }
    >
      {(typeof saved === "string" || deleted) && (
        <p role="status" className="mb-6 rounded-xl bg-success-50 p-4 text-sm font-medium text-success-700 ring-1 ring-success-700/20">
          {deleted ? "Team member removed, with their photo." : "Saved. The website is updated."}
        </p>
      )}
      {members.length === 0 ? (
        <EmptyState>No team members yet. Add the first one to show them on the website.</EmptyState>
      ) : (
        <div className="space-y-10">
          {teamGroups.map((group) => {
            const list = members.filter((m) => m.group === group.value);
            if (list.length === 0) return null;
            return (
              <section key={group.value} aria-labelledby={`group-${group.value}`}>
                <h2 id={`group-${group.value}`} className="text-sm font-semibold tracking-wide text-slate-600 uppercase">
                  {group.label}
                </h2>
                <ul className="mt-3 space-y-3">
                  {list.map((m, i) => (
                    <li
                      key={m.id}
                      className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <TeamAvatar member={{ ...m, photo: adminPhoto(m.photo) }} size="md" round />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{m.name}</h3>
                            <Pill tone={m.visible ? "open" : "closed"}>{m.visible ? "On website" : "Hidden"}</Pill>
                            {!m.photo && <span className="text-xs text-slate-600">No photo</span>}
                          </div>
                          <p className="truncate text-sm text-slate-600">{m.role}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <form action={moveMemberAction.bind(null, m.id, -1)}>
                          <button type="submit" disabled={i === 0} className={buttonClasses({ variant: "ghost", className: "px-3" })}>
                            <ArrowUp aria-hidden="true" className="size-4" />
                            <span className="sr-only">Move {m.name} up</span>
                          </button>
                        </form>
                        <form action={moveMemberAction.bind(null, m.id, 1)}>
                          <button
                            type="submit"
                            disabled={i === list.length - 1}
                            className={buttonClasses({ variant: "ghost", className: "px-3" })}
                          >
                            <ArrowDown aria-hidden="true" className="size-4" />
                            <span className="sr-only">Move {m.name} down</span>
                          </button>
                        </form>
                        <Link href={`/admin/team/${m.id}/edit`} className={buttonClasses({ variant: "secondary" })}>
                          Edit<span className="sr-only"> {m.name}</span>
                        </Link>
                        <form action={setMemberVisibleAction.bind(null, m.id, !m.visible)}>
                          <button type="submit" className={buttonClasses({ variant: m.visible ? "ghost" : "primary" })}>
                            {m.visible ? "Hide" : "Show"}
                            <span className="sr-only"> {m.name}</span>
                          </button>
                        </form>
                        <DeleteMemberButton id={m.id} name={m.name} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
