import { MemoryCacheStore } from "../src/platform/vercel";
import { PlatformContext } from "../src/platform/types";
import { handleRequest } from "../src/router";

const cache = new MemoryCacheStore();

export default async function handler(request: Request): Promise<Response> {
  const platformCtx: PlatformContext = {
    cache,
    clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    waitUntil: (p) => { p.catch(() => {}); },
  };

  return handleRequest(request, platformCtx);
}
