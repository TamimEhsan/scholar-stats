import { ProfileData, CardOptions } from "../types";
import { xmlEscape } from "../security";
import { wrapText, renderWrappedText } from "./text-wrap";

const CONTENT_WIDTH = 420;
const LINE_HEIGHT_AFFILIATION = 16;
const LINE_HEIGHT_INTERESTS = 15;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function renderProfileCard(
  data: ProfileData,
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

  const name = xmlEscape(data.name);
  const affiliation = data.affiliation ?? "";
  const interests = data.interests?.length
    ? data.interests.map((i) => i).join(" · ")
    : "";

  const affiliationLines = wrapText(affiliation, CONTENT_WIDTH, 13);
  const interestLines = wrapText(interests, CONTENT_WIDTH, 12);

  let y = 25;
  let bodyContent = "";

  // Name + icon
  bodyContent += `
  <g transform="translate(25, ${y})">
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="20" height="20" viewBox="0 0 24 24" fill="${accent}" stroke="none">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
    </svg>
    <text x="28" y="16" class="header">${name}</text>
  </g>`;

  y += 30;

  if (affiliationLines.length > 0) {
    const result = renderWrappedText(affiliationLines, 53, y, LINE_HEIGHT_AFFILIATION, "affiliation");
    bodyContent += result.svg;
    y = result.endY + 2;
  }

  if (interestLines.length > 0) {
    const result = renderWrappedText(interestLines, 53, y, LINE_HEIGHT_INTERESTS, "interests");
    bodyContent += result.svg;
    y = result.endY + 2;
  }

  y += 12;

  const statWidth = 140;
  const stats = [
    { label: "Citations", value: formatNumber(data.citations) },
    { label: "h-index", value: data.hIndex.toString() },
    { label: "i10-index", value: data.i10Index.toString() },
  ];

  const totalStatsWidth = stats.length * statWidth;
  const startX = (495 - totalStatsWidth) / 2;

  bodyContent += `
  <rect x="15" y="${y - 12}" width="465" height="60" rx="4" fill="${statBg}"/>`;

  stats.forEach((stat, i) => {
    const cx = startX + i * statWidth + statWidth / 2;
    bodyContent += `
  <g transform="translate(${cx}, ${y})">
    <text x="0" y="12" text-anchor="middle" class="stat-value">${stat.value}</text>
    <text x="0" y="32" text-anchor="middle" class="stat-label">${stat.label}</text>
  </g>`;
  });

  const cardHeight = y + 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="${cardHeight}" viewBox="0 0 495 ${cardHeight}" fill="none">
  <style>
    .header { font: 600 18px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${titleColor}; }
    .affiliation { font: 400 13px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${subtextColor}; }
    .interests { font: 400 12px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${subtextColor}; }
    .stat-label { font: 400 13px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${labelColor}; }
    .stat-value { font: 700 22px 'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif; fill: ${textColor}; }
    .icon { fill: ${accent}; }
  </style>
  <rect x="0.5" y="0.5" width="494" height="${cardHeight - 1}" rx="4.5" fill="${bg}" stroke="${border}"/>${bodyContent}
</svg>`;
}
