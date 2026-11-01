"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { defaultJobPosting } from "@/content/jobs";
import { readAdminConfig } from "@/lib/admin/config";
import { requestLoginCode, verifyLoginCode } from "@/lib/admin/login-codes";
import { endSession, requireAdmin, startSession } from "@/lib/admin/session";
import { candidateStatuses, deleteCandidate, saveReview, type CandidateStatus } from "@/lib/data/candidates";
import { JOBS_TAG, readJobs, writeJobs, type JobStatus, type ManagedJob } from "@/lib/data/jobs";
import { createRedis, type Redis } from "@/lib/data/redis";
import {
  deleteTeamPhoto,
  MAX_PHOTO_BYTES,
  photoUrl,
  readTeam,
  sniffPhoto,
  TEAM_TAG,
  writeTeam,
  writeTeamPhoto,
  type PhotoType,
} from "@/lib/data/team";
import { teamMemberFieldErrors, teamMemberSchema, type TeamMemberErrors } from "@/lib/validation/team-member";
import { readIntakeEnv } from "@/lib/integrations/env";
import { clientIp } from "@/lib/integrations/http";
import { jobPostingFieldErrors, jobPostingSchema, uniqueSlug, type JobPostingErrors } from "@/lib/validation/job-posting";
import { clean } from "@/lib/validation/shared";

/**
 * Admin Server Actions. Every action except sign-in starts with `requireAdmin()` — the session is verified on the
 * server for each call, never trusted from the page. Next.js also rejects cross-site action calls (Origin check).
 * Logs carry outcomes and record IDs only, never candidate details.
 */

const log = (e: Record<string, unknown>) => console.info(JSON.stringify({ event: "admin", ...e }));

function storage(): Redis {
  const redis = createRedis(readIntakeEnv());
  if (!redis) throw new Error("Storage isn't configured for this environment.");
  return redis;
}

// ---- Sign-in -------------------------------------------------------------------------------------------------

export type LoginState = { step: "email" | "code"; email?: string; message?: string; error?: string };

const GENERIC_SENT =
  "If this address has admin access, we've emailed it a 6-digit code. It expires in 10 minutes — check spam if you don't see it.";

export async function requestCodeAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { step: "email", error: "Please enter a valid email address." };

  const env = readIntakeEnv();
  const result = await requestLoginCode(email, clientIp(await headers()), { redis: createRedis(env), env, config: readAdminConfig() });
  log({ action: "request_code", outcome: result });
  if (result === "rate_limited") return { step: "email", email, error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  if (result === "disabled") return { step: "email", error: "Admin sign-in isn't set up for this website yet." };
  // "sent", "not_admin", and "email_failed" look the same, so the form can't be used to discover admin addresses.
  return { step: "code", email, message: GENERIC_SENT };
}

export async function verifyCodeAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const ok = await verifyLoginCode(email, code, { redis: createRedis(readIntakeEnv()), config: readAdminConfig() });
  log({ action: "verify_code", outcome: ok ? "signed_in" : "rejected" });
  if (!ok) return { step: "code", email, error: "That code is incorrect or has expired. Check the latest email, or request a new code." };
  await startSession(email);
  redirect("/admin/candidates");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

// ---- Candidates ----------------------------------------------------------------------------------------------

export type ReviewState = { saved?: boolean; error?: string };

export async function saveCandidateReviewAction(id: string, _prev: ReviewState, form: FormData): Promise<ReviewState> {
  const admin = await requireAdmin();
  const status = String(form.get("status") ?? "") as CandidateStatus;
  if (!candidateStatuses.some((s) => s.value === status)) return { error: "Please choose a status." };
  const notes = clean(String(form.get("notes") ?? "")).slice(0, 5000);
  const ok = await saveReview(storage(), id, { status, notes, updatedAt: new Date().toISOString(), updatedBy: admin.email });
  log({ action: "save_review", id, outcome: ok ? "saved" : "not_found" });
  if (!ok) return { error: "This application no longer exists." };
  refresh();
  return { saved: true };
}

export async function deleteCandidateAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteCandidate(storage(), id);
  log({ action: "delete_candidate", id, outcome: "deleted" });
  redirect("/admin/candidates?deleted=1");
}

// ---- Roles ---------------------------------------------------------------------------------------------------

export type JobFormState = { errors?: JobPostingErrors; error?: string };

export async function saveJobAction(slug: string | null, _prev: JobFormState, form: FormData): Promise<JobFormState> {
  const admin = await requireAdmin();
  const raw = Object.fromEntries([...form].filter(([k, v]) => !k.startsWith("$") && typeof v === "string")) as Record<string, string>;
  const parsed = jobPostingSchema.safeParse(raw);
  if (!parsed.success) return { errors: jobPostingFieldErrors(parsed.error), error: "Please fix the highlighted fields." };
  const p = parsed.data;

  const redis = storage();
  const jobs = await readJobs(redis);
  const now = new Date().toISOString();
  const facts = {
    location: p.location,
    workplace: p.location && /remote/i.test(p.location) ? "Remote" : null,
    employmentType: p.employmentType,
    compensation: p.compensation,
  };
  const content = {
    title: p.title,
    shortTitle: p.shortTitle ?? p.title,
    team: p.team,
    summary: p.summary,
    overview: p.overview,
    workOn: p.workOn,
    lookingFor: p.lookingFor,
    niceToHave: p.niceToHave,
    skills: p.skills,
    facts,
  };

  let saved: ManagedJob;
  if (slug) {
    const i = jobs.findIndex((j) => j.slug === slug);
    if (i < 0) return { error: "This role no longer exists." };
    // The slug never changes after posting, so shared links and applications keep pointing at the role.
    saved = jobs[i] = { ...jobs[i]!, ...content, updatedAt: now, updatedBy: admin.email };
  } else {
    const status: JobStatus = form.get("publish") === "on" ? "open" : "closed";
    saved = {
      slug: uniqueSlug(p.title, jobs.map((j) => j.slug)),
      ...content,
      posting: defaultJobPosting,
      status,
      createdAt: now,
      updatedAt: now,
      updatedBy: admin.email,
    };
    jobs.push(saved);
  }
  await writeJobs(redis, jobs);
  updateTag(JOBS_TAG);
  log({ action: slug ? "update_job" : "create_job", slug: saved.slug, status: saved.status });
  redirect(`/admin/roles?saved=${encodeURIComponent(saved.slug)}`);
}

export async function setJobStatusAction(slug: string, status: JobStatus): Promise<void> {
  const admin = await requireAdmin();
  if (status !== "open" && status !== "closed") return;
  const redis = storage();
  const jobs = await readJobs(redis);
  const job = jobs.find((j) => j.slug === slug);
  if (!job) return;
  Object.assign(job, { status, updatedAt: new Date().toISOString(), updatedBy: admin.email });
  await writeJobs(redis, jobs);
  updateTag(JOBS_TAG);
  log({ action: status === "open" ? "reopen_job" : "withdraw_job", slug });
  refresh();
}

// ---- Team ----------------------------------------------------------------------------------------------------

export type TeamFormState = { errors?: TeamMemberErrors; error?: string };

/** Decodes and checks an uploaded portrait: real JPEG/PNG/WebP bytes, within the size limit. */
function decodePhoto(base64: string): { type: PhotoType; data: string } | { error: string } {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return { error: "That photo couldn't be read. Please choose a JPEG, PNG, or WebP image." };
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_PHOTO_BYTES) return { error: "That photo is too large. Please choose a smaller image." };
  const type = sniffPhoto(bytes);
  if (!type) return { error: "Please choose a JPEG, PNG, or WebP image." };
  return { type, data: bytes.toString("base64") };
}

export async function saveMemberAction(id: string | null, _prev: TeamFormState, form: FormData): Promise<TeamFormState> {
  const admin = await requireAdmin();
  const raw = Object.fromEntries([...form].filter(([k, v]) => !k.startsWith("$") && typeof v === "string")) as Record<string, string>;
  const parsed = teamMemberSchema.safeParse(raw);
  const upload = (raw.photo ?? "").trim();
  const photo = upload ? decodePhoto(upload) : null;
  const photoError = photo && "error" in photo ? photo.error : undefined;
  if (!parsed.success || photoError) {
    return {
      errors: { ...(parsed.success ? {} : teamMemberFieldErrors(parsed.error)), ...(photoError ? { photo: photoError } : {}) },
      error: "Please fix the highlighted fields.",
    };
  }
  const p = parsed.data;

  const redis = storage();
  const members = await readTeam(redis);
  const now = new Date().toISOString();
  const existing = id ? members.find((m) => m.id === id) : undefined;
  if (id && !existing) return { error: "This team member no longer exists." };
  const memberId = existing?.id ?? uniqueSlug(p.name, members.map((m) => m.id));

  let photoPath = existing?.photo ?? null;
  if (photo && !("error" in photo)) {
    const version = Date.now().toString(36);
    await writeTeamPhoto(redis, memberId, { ...photo, version });
    photoPath = photoUrl(memberId, version);
  } else if (raw.removePhoto === "on") {
    await deleteTeamPhoto(redis, memberId);
    photoPath = null;
  }

  const content = { name: p.name, role: p.role, focus: p.focus, group: p.group, bio: p.bio, profileUrl: p.profileUrl, photo: photoPath };
  if (existing) {
    Object.assign(existing, content, { updatedAt: now, updatedBy: admin.email });
  } else {
    members.push({ id: memberId, ...content, visible: form.get("publish") === "on", updatedAt: now, updatedBy: admin.email });
  }
  await writeTeam(redis, members);
  updateTag(TEAM_TAG);
  log({ action: existing ? "update_member" : "create_member", id: memberId, photo: photo ? "uploaded" : raw.removePhoto === "on" ? "removed" : "unchanged" });
  redirect(`/admin/team?saved=${encodeURIComponent(memberId)}`);
}

/** Moves a member up or down among the members of the same section (the order the website shows). */
export async function moveMemberAction(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const redis = storage();
  const members = await readTeam(redis);
  const i = members.findIndex((m) => m.id === id);
  if (i < 0) return;
  let j = i + direction;
  while (j >= 0 && j < members.length && members[j]!.group !== members[i]!.group) j += direction;
  if (j < 0 || j >= members.length) return;
  [members[i], members[j]] = [members[j]!, members[i]!];
  await writeTeam(redis, members);
  updateTag(TEAM_TAG);
  log({ action: "move_member", id });
  refresh();
}

export async function setMemberVisibleAction(id: string, visible: boolean): Promise<void> {
  const admin = await requireAdmin();
  const redis = storage();
  const members = await readTeam(redis);
  const member = members.find((m) => m.id === id);
  if (!member) return;
  Object.assign(member, { visible, updatedAt: new Date().toISOString(), updatedBy: admin.email });
  await writeTeam(redis, members);
  updateTag(TEAM_TAG);
  log({ action: visible ? "show_member" : "hide_member", id });
  refresh();
}

export async function deleteMemberAction(id: string): Promise<void> {
  await requireAdmin();
  const redis = storage();
  const members = await readTeam(redis);
  if (!members.some((m) => m.id === id)) return;
  await writeTeam(redis, members.filter((m) => m.id !== id));
  await deleteTeamPhoto(redis, id);
  updateTag(TEAM_TAG);
  log({ action: "delete_member", id });
  redirect("/admin/team?deleted=1");
}
