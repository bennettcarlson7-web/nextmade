import { photoResponse } from "@/lib/data/team";
import { createRedis } from "@/lib/data/redis";
import { readIntakeEnv } from "@/lib/integrations/env";

/** Public portrait of a team member shown on the website. Each upload gets a new URL, so it's cached for good. */
export async function GET(_req: Request, { params }: RouteContext<"/team-photo/[id]/[version]">) {
  const { id, version } = await params;
  return photoResponse(createRedis(readIntakeEnv()), id, version, "public");
}
