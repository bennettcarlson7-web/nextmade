import { getAdminSession } from "@/lib/admin/session";
import { photoResponse } from "@/lib/data/team";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";

/** Any team member's portrait, including hidden members'. Admins only; never cached. */
export async function GET(_req: Request, { params }: RouteContext<"/admin/team-photo/[id]/[version]">) {
  if (!(await getAdminSession())) return new Response("Not found", { status: 404 });
  const { id, version } = await params;
  return photoResponse(createRedis(readIntakeEnv()), id, version, "admin");
}
