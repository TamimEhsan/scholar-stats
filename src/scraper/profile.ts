import { ProfileData } from "../types";

const SCHOLAR_URL = "https://scholar.google.com/citations";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function extractText(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

function extractStatsRow(html: string, label: string): number {
  const pattern = new RegExp(
    `>${label}</a>\\s*</td>\\s*<td[^>]*class="gsc_rsb_std"[^>]*>(\\d[\\d,]*)</td>`,
    "i"
  );
  const match = html.match(pattern);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

export async function scrapeProfile(userId: string): Promise<ProfileData> {
  const url = `${SCHOLAR_URL}?user=${encodeURIComponent(userId)}&hl=en`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://scholar.google.com/",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (response.status === 429 || response.status === 403) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    console.error(`Scholar HTTP ${response.status} for user ${userId}`);
    throw new Error("RATE_LIMITED");
  }

  const html = await response.text();

  if (html.includes("Please show you&#39;re not a robot") || html.includes("CAPTCHA")) {
    throw new Error("CAPTCHA");
  }

  const name = extractText(html, /id="gsc_prf_in"[^>]*>([^<]+)</);
  if (!name) {
    throw new Error("USER_NOT_FOUND");
  }

  const affiliationMatch = html.match(
    /class="gsc_prf_il"(?:(?!id=)[^>])*>([\s\S]*?)<\/div>/
  );
  const affiliation = affiliationMatch
    ? affiliationMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";

  const interests: string[] = [];
  const interestPattern = /class="gsc_prf_inta[^"]*"[^>]*>([^<]+)</g;
  let interestMatch;
  while ((interestMatch = interestPattern.exec(html)) !== null) {
    interests.push(interestMatch[1].trim());
  }

  const citations = extractStatsRow(html, "Citations");
  const hIndex = extractStatsRow(html, "h-index");
  const i10Index = extractStatsRow(html, "i10-index");

  return {
    name,
    affiliation,
    interests,
    citations,
    hIndex,
    i10Index,
    scrapedAt: Date.now(),
  };
}
