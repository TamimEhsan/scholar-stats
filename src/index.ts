import { Env, CardOptions, ProfileData, PaperData } from "./types";

type DataResult<T> = { data: T; error: null } | { data: null; error: string };
import {
  validateOrcid,
  validateOpenAlexAuthor,
  validatePaperId,
  validateColor,
  parseTheme,
  checkRateLimit,
  cleanupRateLimitMap,
} from "./security";
import { renderErrorCard } from "./svg/error-card";
import { renderProfileCard } from "./svg/profile-card";
import { renderPaperCard } from "./svg/paper-card";
import { renderBadge } from "./svg/badge";
import { scrapeProfile } from "./scraper/profile";
import { scrapePaper } from "./scraper/paper";
import {
  getCachedProfile,
  cacheProfile,
  getCachedPaper,
  cachePaper,
  isStale,
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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

function handleScrapeError(err: unknown, url: URL): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  const json = isJson(url);

  const errorMap: Record<string, { msg: string; status: number }> = {
    RATE_LIMITED: { msg: "OpenAlex is temporarily unavailable — try again later", status: 503 },
    USER_NOT_FOUND: { msg: "Author not found for this ORCID", status: 404 },
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
    const path = url.pathname;

    // Cards
    if (path === "/card/profile") return handleCardProfile(url, env, ctx);
    if (path === "/card/paper") return handleCardPaper(url, env, ctx);

    // Badges - profile
    if (path === "/badge/profile/citations") return handleProfileBadge(url, env, ctx, "citations");
    if (path === "/badge/profile/h-index") return handleProfileBadge(url, env, ctx, "h-index");
    if (path === "/badge/profile/i10-index") return handleProfileBadge(url, env, ctx, "i10-index");

    // Badges - paper
    if (path === "/badge/paper/citations") return handlePaperBadge(url, env, ctx);

    if (path === "/") {
      return jsonResponse({
        service: "Scholar Badge API",
        cards: {
          profile: "/card/profile?orcid=ORCID",
          paper: "/card/paper?paper=PAPER_ID",
        },
        badges: {
          "profile/citations": "/badge/profile/citations?orcid=ORCID",
          "profile/h-index": "/badge/profile/h-index?orcid=ORCID",
          "profile/i10-index": "/badge/profile/i10-index?orcid=ORCID",
          "paper/citations": "/badge/paper/citations?paper=PAPER_ID",
        },
        params: {
          orcid: "ORCID iD (e.g. 0000-0002-9322-3515)",
          id: "OpenAlex author ID (e.g. A5023888391) — alternative to orcid",
          paper: "OpenAlex work ID (e.g. W2919115771) or DOI (e.g. 10.1234/example)",
          theme: "light | dark (default: light)",
          color: "hex accent color (default: 4285f4)",
          format: "json (default: svg)",
        },
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};

// --- Helpers to fetch profile/paper data with caching ---

async function getProfileData(url: URL, env: Env, ctx: ExecutionContext): Promise<DataResult<ProfileData>> {
  const orcid = validateOrcid(url.searchParams.get("orcid"));
  const openalexId = validateOpenAlexAuthor(url.searchParams.get("id"));

  if (!orcid && !openalexId) {
    return { data: null, error: "Missing or invalid 'orcid' or 'id' parameter (e.g. orcid=0000-0002-9322-3515 or id=A5023888391)" };
  }

  const authorId = (orcid ?? openalexId)!;
  const type = orcid ? "orcid" : "openalex";
  const cacheKey = type === "orcid" ? authorId : `openalex:${authorId}`;

  let data = await getCachedProfile(env, cacheKey);

  if (data && isStale(data.fetchedAt)) {
    ctx.waitUntil(
      scrapeProfile(authorId, type)
        .then((fresh) => cacheProfile(env, cacheKey, fresh))
        .catch((err) => console.error("Background refresh failed:", err))
    );
  }

  if (!data) {
    data = await scrapeProfile(authorId, type);
    await cacheProfile(env, cacheKey, data);
  }

  return { data, error: null };
}

async function getPaperData(url: URL, env: Env, ctx: ExecutionContext): Promise<DataResult<PaperData>> {
  const paperId = validatePaperId(url.searchParams.get("paper"));
  if (!paperId) return { data: null, error: "Missing or invalid 'paper' parameter (e.g. W2919115771 or DOI)" };

  let data = await getCachedPaper(env, paperId);

  if (data && isStale(data.fetchedAt)) {
    ctx.waitUntil(
      scrapePaper(paperId)
        .then((fresh) => cachePaper(env, paperId, fresh))
        .catch((err) => console.error("Background refresh failed:", err))
    );
  }

  if (!data) {
    data = await scrapePaper(paperId);
    await cachePaper(env, paperId, data);
  }

  return { data, error: null };
}

// --- Card handlers ---

async function handleCardProfile(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const json = isJson(url);
  const options = parseCardOptions(url);

  try {
    const result = await getProfileData(url, env, ctx);
    if (result.error) {
      return json
        ? jsonResponse({ error: result.error }, 400)
        : svgResponse(renderErrorCard(result.error, options), 400);
    }
    const data = result.data!;
    return json ? jsonResponse(data) : svgResponse(renderProfileCard(data, options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}

async function handleCardPaper(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const json = isJson(url);
  const options = parseCardOptions(url);

  try {
    const result = await getPaperData(url, env, ctx);
    if (result.error) {
      return json
        ? jsonResponse({ error: result.error }, 400)
        : svgResponse(renderErrorCard(result.error, options), 400);
    }
    const data = result.data!;
    return json ? jsonResponse(data) : svgResponse(renderPaperCard(data, options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}

// --- Badge handlers ---

type ProfileStat = "citations" | "h-index" | "i10-index";

async function handleProfileBadge(
  url: URL, env: Env, ctx: ExecutionContext, stat: ProfileStat
): Promise<Response> {
  const json = isJson(url);
  const options = parseCardOptions(url);

  try {
    const result = await getProfileData(url, env, ctx);
    if (result.error) {
      return json
        ? jsonResponse({ error: result.error }, 400)
        : svgResponse(renderBadge("error", result.error, options), 400);
    }

    const data = result.data!;
    const valueMap: Record<ProfileStat, { label: string; value: number }> = {
      "citations": { label: "Citations", value: data.citations },
      "h-index": { label: "h-index", value: data.hIndex },
      "i10-index": { label: "i10-index", value: data.i10Index },
    };

    const { label, value } = valueMap[stat];

    if (json) {
      return jsonResponse({ label, value });
    }
    return svgResponse(renderBadge(label, formatNumber(value), options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}

async function handlePaperBadge(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const json = isJson(url);
  const options = parseCardOptions(url);

  try {
    const result = await getPaperData(url, env, ctx);
    if (result.error) {
      return json
        ? jsonResponse({ error: result.error }, 400)
        : svgResponse(renderBadge("error", result.error, options), 400);
    }

    const data = result.data!;
    if (json) {
      return jsonResponse({ label: "Citations", value: data.citations });
    }
    return svgResponse(renderBadge("Citations", formatNumber(data.citations), options));
  } catch (err) {
    return handleScrapeError(err, url);
  }
}
