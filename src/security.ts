const SCHOLAR_ID_PATTERN = /^[a-zA-Z0-9_-]{1,30}$/;
const PAPER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,30}$/;
const HEX_COLOR_PATTERN = /^[0-9a-fA-F]{6}$/;

export function validateScholarId(id: string | null): string | null {
  if (!id || !SCHOLAR_ID_PATTERN.test(id)) return null;
  return id;
}

export function validatePaperId(id: string | null): string | null {
  if (!id || !PAPER_ID_PATTERN.test(id)) return null;
  return id;
}

export function validateColor(color: string | null): string | null {
  if (!color || !HEX_COLOR_PATTERN.test(color)) return null;
  return color;
}

export function parseTheme(
  theme: string | null
): "light" | "dark" {
  return theme === "dark" ? "dark" : "light";
}

export function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// Periodically clean up stale entries to prevent memory growth
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

export function cleanupRateLimitMap(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}
