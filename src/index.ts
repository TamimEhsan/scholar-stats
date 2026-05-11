import { Env } from "./types";
import {
  validateScholarId,
  validatePaperId,
  checkRateLimit,
  cleanupRateLimitMap,
} from "./security";
import { scrapeProfile } from "./scraper/profile";
import { scrapePaper } from "./scraper/paper";
import {
  getCachedProfile,
  cacheProfile,
  getCachedPaper,
  cachePaper,
} from "./cache";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

function handleScrapeError(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Unknown error";

  if (message === "RATE_LIMITED" || message === "CAPTCHA") {
    return errorResponse("Scholar is temporarily unavailable — try again later", 503);
  }
  if (message === "USER_NOT_FOUND") {
    return errorResponse("Scholar profile not found", 404);
  }
  if (message === "PAPER_NOT_FOUND") {
    return errorResponse("Paper not found", 404);
  }

  console.error("Scrape error:", message);
  return errorResponse("Failed to fetch data — try again later", 500);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    cleanupRateLimitMap();

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return errorResponse("Rate limited — try again in a minute", 429);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
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
        });
      default:
        return errorResponse("Not found", 404);
    }
  },
};

async function handleProfile(url: URL, env: Env): Promise<Response> {
  const userId = validateScholarId(url.searchParams.get("user"));

  if (!userId) {
    return errorResponse("Missing or invalid 'user' parameter", 400);
  }

  try {
    let data = await getCachedProfile(env, userId);
    if (!data) {
      data = await scrapeProfile(userId);
      await cacheProfile(env, userId, data);
    }
    return jsonResponse(data);
  } catch (err) {
    return handleScrapeError(err);
  }
}

async function handlePaper(url: URL, env: Env): Promise<Response> {
  const userId = validateScholarId(url.searchParams.get("user"));
  const paperId = validatePaperId(url.searchParams.get("paper"));

  if (!userId || !paperId) {
    return errorResponse("Missing or invalid 'user' and/or 'paper' parameter", 400);
  }

  try {
    let data = await getCachedPaper(env, userId, paperId);
    if (!data) {
      data = await scrapePaper(userId, paperId);
      await cachePaper(env, userId, paperId, data);
    }
    return jsonResponse(data);
  } catch (err) {
    return handleScrapeError(err);
  }
}
