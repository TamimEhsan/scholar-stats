import { PaperData, CardOptions } from "../types";
import { xmlEscape } from "../security";
import { wrapText, renderWrappedText } from "./text-wrap";

const CONTENT_WIDTH = 420;
const LINE_HEIGHT_TITLE = 18;
const LINE_HEIGHT_AUTHORS = 16;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function renderPaperCard(
  data: PaperData,
  options: CardOptions
): string {
  const isDark = options.theme === "dark";
  const accent = `#${options.color}`;
  const bg = isDark ? "#0d1117" : "#ffffff";
  const border = isDark ? "#30363d" : "#e4e2e2";
  const titleColor = isDark ? "#58a6ff" : accent;
  const textColor = isDark ? "#c9d1d9" : "#333333";
  const subtextColor = isDark ? "#8b949e" : "#666666";
  const labelColor = isDark ? "#8b949e" : "#777777";
  const statBg = isDark ? "#161b22" : "#f6f8fa";

  const venue = data.venue ?? "";
  const year = data.year ?? "";
  const venueYear = [venue, year].filter(Boolean).join(", ");

  const titleLines = wrapText(data.title, CONTENT_WIDTH, 16);
  const authorLines = wrapText(data.authors, CONTENT_WIDTH, 13);

  let y = 32;
  let bodyContent = "";

  // Title with icon
  bodyContent += `
  <g transform="translate(25, ${y})">
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="${accent}" stroke="none">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h6v2h-6v-2zm0 4h6v2h-6v-2zM8 13h2v2H8v-2zm0 4h2v2H8v-2z"/>
    </svg>`;

  // First title line aligned with icon
  if (titleLines.length > 0) {
    bodyContent += `
    <text x="26" y="14" class="title">${xmlEscape(titleLines[0])}</text>`;
  }
  bodyContent += `
  </g>`;

  // First line is at absolute y = 32 + 14 = 46
  y = 46 + LINE_HEIGHT_TITLE;

  // Remaining title lines
  if (titleLines.length > 1) {
    const remaining = renderWrappedText(
      titleLines.slice(1),
      51, y, LINE_HEIGHT_TITLE, "title"
    );
    bodyContent += remaining.svg;
    y = remaining.endY + 4;
  } else {
    y += 4;
  }

  // Authors
  if (authorLines.length > 0) {
    const result = renderWrappedText(authorLines, 51, y, LINE_HEIGHT_AUTHORS, "authors");
    bodyContent += result.svg;
    y = result.endY + 2;
  }

  // Venue + year
  if (venueYear) {
    bodyContent += `
  <text x="51" y="${y}" class="venue">${xmlEscape(venueYear)}</text>`;
    y += 18;
  }

  y += 8;

  // Citation stat box
  bodyContent += `
  <rect x="15" y="${y}" width="465" height="45" rx="4" fill="${statBg}"/>
  <g transform="translate(247, ${y + 13})">
    <text x="0" y="0" text-anchor="middle" class="cite-value">${formatNumber(data.citations)}</text>
    <text x="0" y="20" text-anchor="middle" class="cite-label">Citations</text>
  </g>`;

  const cardHeight = y + 55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="${cardHeight}" viewBox="0 0 495 ${cardHeight}" fill="none">
  <style>
    .title { font: 600 16px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${titleColor}; }
    .authors { font: 400 13px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${textColor}; }
    .venue { font: 400 12px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${subtextColor}; }
    .cite-label { font: 400 13px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${labelColor}; }
    .cite-value { font: 700 24px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${textColor}; }
    .icon { fill: ${accent}; }
  </style>
  <rect x="0.5" y="0.5" width="494" height="${cardHeight - 1}" rx="4.5" fill="${bg}" stroke="${border}"/>${bodyContent}
</svg>`;
}
