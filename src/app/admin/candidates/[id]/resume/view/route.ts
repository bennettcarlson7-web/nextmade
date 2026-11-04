import { getAdminSession } from "@/lib/admin/session";
import { getCandidate } from "@/lib/data/candidates";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";

/**
 * Shows a candidate's PDF résumé inline, for the viewer on the candidate page. Admins only. Only real PDFs are
 * served this way (checked by their first bytes, never by name or browser-supplied type); Word files are
 * download-only. Framing is allowed for this site's own pages only; nothing is cached.
 */
export async function GET(_req: Request, { params }: RouteContext<"/admin/candidates/[id]/resume/view">) {
  if (!(await getAdminSession())) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const redis = createRedis(readIntakeEnv());
  const c = redis ? await getCandidate(redis, id) : null;
  const resume = c?.data.resume as { filename?: string; data?: string } | undefined;
  if (!resume?.data) return new Response("Not found", { status: 404 });

  const body = Buffer.from(resume.data, "base64");
  if (body.subarray(0, 5).toString("latin1") !== "%PDF-") return new Response("Only PDF résumés can be previewed.", { status: 415 });
  const ascii = (resume.filename ?? "resume.pdf").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(body.length),
      "Content-Disposition": `inline; filename="${ascii}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
