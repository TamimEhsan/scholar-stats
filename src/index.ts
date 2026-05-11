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
import { renderProfileCard } from "./svg/profile-card";
import { renderPaperCard } from "./svg/paper-card";
import { scrapeProfile } from "./scraper/profile";
import { scrapePaper } from "./scraper/paper";
import {
  getCachedProfile,
  cacheProfile,
  getCachedPaper,
  cachePaper,
} from "./cache";

const CACHE_HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=3600" };

function svgResponse(svg: string, status = 200): Response {
  return new Response(svg, {
    status,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", ...CACHE_HEADERS },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CACHE_HEADERS },
  });
}

function parseCardOptions(url: URL): CardOptions {
  return {
    theme: parseTheme(url.searchParams.get("theme")),
    color: validateColor(url.searchParams.get("color")) ?? "4285f4",
  };
}

function isJson(url: URL): boolean {
  return url.searchParams.get("format") === "json";
}

function handleScrapeError(err: unknown, url: URL): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  const json = isJson(url);

  const errorMap: Record<string, { msg: string; status: number }> = {
    RATE_LIMITED: { msg: "Scholar is temporarily unavailable — try again later", status: 503 },
    CAPTCHA: { msg: "Scholar is temporarily unavailable — try again later", status: 503 },
    USER_NOT_FOUND: { msg: "Scholar profile not found", status: 404 },
    PAPER_NOT_FOUND: { msg: "Paper not found", status: 404 },
  };

  const mapped = errorMap[message];
  const errorMsg = mapped?.msg ?? "Failed to fetch data — try again later";
  const status = mapped?.status ?? 500;

  if (!mapped) console.error("Scrape error:", message);

  if (json) {
    return jsonResponse({ error: errorMsg }, status);
  }
  return svgResponse(renderErrorCard(errorMsg, parseCardOptions(url)), status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    cleanupRateLimitMap();

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (!checkRateLimit(ip)) {
      const url = new URL(request.url);
      if (isJson(url)) {
        return jsonResponse({ error: "Rate limited — try again in a minute" }, 429);
      }
      return svgResponse(
        renderErrorCard("Rate limited — try again in a minute", parseCardOptions(url)),
        429
      );
    }

    const url = new URL(request.url);

    switch (url.pathname) {
      case "/profile":
        return handleProfile(url, env);
      case "/paper":
        return handlePaper(url, env);
      case "/":
        return jsonResponse({
          service: "Scholar Badge API",
          endpoints: {
            profile: "/profile?user=SCHOLAR_ID",
            paper: "/paper?user=USER_ID&paper=PAPER_ID",
          },
          params: {
            theme: "light | dark (default: light)",
            color: "hex accent color (default: 4285f4)",
            format: "json (default: svg)",
          },
        });
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  },
};

async function handleProfile(url: URL, env: Env): Promise<Response> {
  const userId = validateScholarId(url.searchParams.get("user"));
  const json = isJson(url);
  const options = parseCardOptions(url);

  if (!userId) {
    const msg = "Missing or invalid 'user' parameter";
    return json
      ? jsonResponse({ error: msg }, 400)
      : svgResponse(renderErrorCard(msg, options), 400);
  }

  try {
    let data = await getCachedProfile(env, userId);
    if (!data) {
      data = await scrapeProfile(userId);
      await cacheProfile(env, userId, data);
    }
    return json ? jsonResponse(data) : svgResponse(renderProfileCard(data, options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}

async function handlePaper(url: URL, env: Env): Promise<Response> {
  const userId = validateScholarId(url.searchParams.get("user"));
  const paperId = validatePaperId(url.searchParams.get("paper"));
  const json = isJson(url);
  const options = parseCardOptions(url);

  if (!userId || !paperId) {
    const msg = "Missing or invalid 'user' and/or 'paper' parameter";
    return json
      ? jsonResponse({ error: msg }, 400)
      : svgResponse(renderErrorCard(msg, options), 400);
  }

  try {
    let data = await getCachedPaper(env, userId, paperId);
    if (!data) {
      data = await scrapePaper(userId, paperId);
      await cachePaper(env, userId, paperId, data);
    }
    return json ? jsonResponse(data) : svgResponse(renderPaperCard(data, options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}
