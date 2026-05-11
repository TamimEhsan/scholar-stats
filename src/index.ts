import { Env, CardOptions } from "./types";
import {
  validateScholarId,
  validatePaperId,
  validateColor,
  parseTheme,
  checkRateLimit,
  cleanupRateLimitMap,
} from "./security";
import { renderErrorCard } from "./svg/error-card";

const SVG_HEADERS: HeadersInit = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

function svgResponse(svg: string, status = 200): Response {
  return new Response(svg, { status, headers: SVG_HEADERS });
}

function parseCardOptions(url: URL): CardOptions {
  return {
    theme: parseTheme(url.searchParams.get("theme")),
    color: validateColor(url.searchParams.get("color")) ?? "4285f4",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    cleanupRateLimitMap();

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (!checkRateLimit(ip)) {
      const options = parseCardOptions(new URL(request.url));
      return svgResponse(
        renderErrorCard("Rate limited — try again in a minute", options),
        429
      );
    }

    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case "/profile":
        return handleProfile(url, env);
      case "/paper":
        return handlePaper(url, env);
      case "/":
        return new Response(
          "Scholar Badge API. Usage: /profile?user=SCHOLAR_ID or /paper?user=USER_ID&paper=PAPER_ID",
          { status: 200 }
        );
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};

async function handleProfile(url: URL, _env: Env): Promise<Response> {
  const options = parseCardOptions(url);
  const userId = validateScholarId(url.searchParams.get("user"));

  if (!userId) {
    return svgResponse(
      renderErrorCard("Missing or invalid 'user' parameter", options),
      400
    );
  }

  // TODO: Phase 2 — scrape + cache + render
  return svgResponse(
    renderErrorCard("Profile card coming soon", options),
    501
  );
}

async function handlePaper(url: URL, _env: Env): Promise<Response> {
  const options = parseCardOptions(url);
  const userId = validateScholarId(url.searchParams.get("user"));
  const paperId = validatePaperId(url.searchParams.get("paper"));

  if (!userId || !paperId) {
    return svgResponse(
      renderErrorCard(
        "Missing or invalid 'user' and/or 'paper' parameter",
        options
      ),
      400
    );
  }

  // TODO: Phase 2 — scrape + cache + render
  return svgResponse(
    renderErrorCard("Paper card coming soon", options),
    501
  );
}
