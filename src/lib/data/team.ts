import { cacheLife, cacheTag } from "next/cache";
import { team as seedTeam, type TeamMember } from "@/content/team";
import { readIntakeEnv } from "@/lib/integrations/env";
import { slugify } from "@/lib/validation/job-posting";
import { createRedis, type Redis } from "./redis";

/**
 * Team profiles, managed from the admin area (/admin/team). The list is one JSON document (order matters and a
 * small team fits easily); each portrait is stored separately under its member id and served from
 * /team-photo/<id>/<version>. Until the admin saves for the first time, src/content/team.ts is the starting data.
 */

export type ManagedMember = TeamMember & {
  id: string;
  /** Hidden members stay in the admin list but don't appear on the website. */
  visible: boolean;
  updatedAt: string;
  updatedBy?: string;
};

export type TeamPhoto = { type: PhotoType; data: string; version: string };
export type PhotoType = "image/jpeg" | "image/png" | "image/webp";

export const TEAM_KEY = "team:v1";
/** Cache tag for every public page that shows the team; admin changes call `updateTag(TEAM_TAG)`. */
export const TEAM_TAG = "team";
export const photoKey = (id: string) => `team-photo:${id}`;
export const photoUrl = (id: string, version: string) => `/team-photo/${encodeURIComponent(id)}/${encodeURIComponent(version)}`;
/** The admin area shows portraits through its own route, which can see hidden members (the session cookie is scoped to /admin). */
export const adminPhoto = (photo: string | null) => (photo?.startsWith("/team-photo/") ? `/admin${photo}` : photo);

/**
 * The HTTP response for a stored portrait. Public requests get only visible members' photos, cached for good
 * (the URL changes with every upload); admin requests can see hidden members too, and are never cached.
 */
export async function photoResponse(redis: Redis | undefined, id: string, version: string, audience: "public" | "admin"): Promise<Response> {
  const notFound = () => new Response("Not found", { status: 404 });
  if (!redis) return notFound();
  const [photo, members] = await Promise.all([readTeamPhoto(redis, id), readTeam(redis)]);
  const member = members.find((m) => m.id === id);
  if (!photo || !member || photo.version !== version) return notFound();
  if (audience === "public" && !member.visible) return notFound();
  const body = Buffer.from(photo.data, "base64");
  return new Response(body, {
    headers: {
      "Content-Type": photo.type,
      "Content-Length": String(body.length),
      "Cache-Control": audience === "public" ? "public, max-age=31536000, immutable" : "private, no-store",
    },
  });
}

/** Largest stored portrait. The admin form resizes photos to 640×640 before upload, which is far smaller. */
export const MAX_PHOTO_BYTES = 700 * 1024;

const SEEDED_AT = "2026-10-28T00:00:00.000Z";

export function seedManagedTeam(): ManagedMember[] {
  return seedTeam.map((m) => ({ ...m, bio: m.bio ?? null, id: slugify(m.name), visible: true, updatedAt: SEEDED_AT }));
}

/** Authoritative, uncached read (admin pages). Falls back to the starting team when nothing has been saved. */
export async function readTeam(redis: Redis | undefined): Promise<ManagedMember[]> {
  if (!redis) return seedManagedTeam();
  const [raw] = await redis.exec([["GET", TEAM_KEY]]);
  if (typeof raw !== "string") return seedManagedTeam();
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("team_corrupt");
  return parsed as ManagedMember[];
}

export async function writeTeam(redis: Redis, members: ManagedMember[]): Promise<void> {
  await redis.exec([["SET", TEAM_KEY, JSON.stringify(members)]]);
}

export async function readTeamPhoto(redis: Redis, id: string): Promise<TeamPhoto | null> {
  const [raw] = await redis.exec([["GET", photoKey(id)]]);
  return typeof raw === "string" ? (JSON.parse(raw) as TeamPhoto) : null;
}

export async function writeTeamPhoto(redis: Redis, id: string, photo: TeamPhoto): Promise<void> {
  await redis.exec([["SET", photoKey(id), JSON.stringify(photo)]]);
}

export async function deleteTeamPhoto(redis: Redis, id: string): Promise<void> {
  await redis.exec([["DEL", photoKey(id)]]);
}

/** Identifies an uploaded image by its first bytes; the browser-supplied type is never trusted. */
export function sniffPhoto(bytes: Uint8Array): PhotoType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Cached read for public pages (visible members, in admin order): prerendered, refreshed instantly by
 * `updateTag(TEAM_TAG)` after an admin change, and at most a few minutes stale otherwise.
 */
export async function getTeamMembers(): Promise<ManagedMember[]> {
  "use cache";
  cacheTag(TEAM_TAG);
  cacheLife("minutes");
  try {
    return (await readTeam(createRedis(readIntakeEnv()))).filter((m) => m.visible);
  } catch (err) {
    console.error(JSON.stringify({ event: "team", outcome: "read_failed", detail: err instanceof Error ? err.message : "error" }));
    return seedManagedTeam();
  }
}
