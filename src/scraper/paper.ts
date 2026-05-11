import { PaperData } from "../types";

const SCHOLAR_URL = "https://scholar.google.com/citations";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function extractField(html: string, fieldName: string): string {
  const pattern = new RegExp(
    `<div class="gsc_oci_field">${fieldName}</div>\\s*<div class="gsc_oci_value"[^>]*>([^<]+)`,
    "i"
  );
  const match = html.match(pattern);
  return match ? match[1].trim() : "";
}

function extractTitle(html: string): string {
  const match = html.match(
    /id="gsc_oci_title"[^>]*>(?:<a[^>]*>)?([^<]+)/
  );
  return match ? match[1].trim() : "";
}

function extractCitations(html: string): number {
  const match = html.match(
    /Cited by\s*(\d[\d,]*)/i
  );
  if (!match) {
    const fieldMatch = html.match(
      /Total citations[\s\S]*?Cited by[^>]*>(\d[\d,]*)/i
    );
    if (fieldMatch) return parseInt(fieldMatch[1].replace(/,/g, ""), 10);
    return 0;
  }
  return parseInt(match[1].replace(/,/g, ""), 10);
}

function extractYear(dateStr: string): string {
  const match = dateStr.match(/(\d{4})/);
  return match ? match[1] : "";
}

export async function scrapePaper(
  userId: string,
  paperId: string
): Promise<PaperData> {
  const url = `${SCHOLAR_URL}?view_op=view_citation&hl=en&citation_for_view=${encodeURIComponent(userId)}:${encodeURIComponent(paperId)}`;

  const response = await fetch(url, {
    headers: { "User-Agent": randomUA() },
  });

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    throw new Error(`Scholar returned ${response.status}`);
  }

  const html = await response.text();

  if (html.includes("Please show you&#39;re not a robot") || html.includes("CAPTCHA")) {
    throw new Error("CAPTCHA");
  }

  const title = extractTitle(html);
  if (!title) {
    throw new Error("PAPER_NOT_FOUND");
  }

  const authors = extractField(html, "Authors");
  const publicationDate = extractField(html, "Publication date");
  const venue =
    extractField(html, "Journal") ||
    extractField(html, "Conference") ||
    extractField(html, "Source") ||
    extractField(html, "Book");
  const citations = extractCitations(html);
  const year = extractYear(publicationDate);

  return {
    title,
    authors,
    year,
    citations,
    venue,
    scrapedAt: Date.now(),
  };
}
