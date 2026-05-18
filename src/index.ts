import { CloudflareCacheStore } from "./platform/cloudflare";
import { PlatformContext } from "./platform/types";
import { handleRequest } from "./router";

interface Env {
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const platformCtx: PlatformContext = {
      cache: new CloudflareCacheStore(env.CACHE),
      clientIp: request.headers.get("CF-Connecting-IP") ?? "unknown",
      waitUntil: (p) => ctx.waitUntil(p),
    };

    return handleRequest(request, platformCtx);
  },
};
