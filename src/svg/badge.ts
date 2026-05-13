import { CardOptions } from "../types";
import { xmlEscape } from "../security";

function measureText(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    if (ch === " ") width += 3.4;
    else if ("iljt,.;:!|'".includes(ch)) width += 4.2;
    else if ("mwMWDOQG@".includes(ch)) width += 8.5;
    else if (ch >= "A" && ch <= "Z") width += 7.5;
    else if ("0123456789".includes(ch)) width += 6.5;
    else width += 6.3;
  }
  return width * (fontSize / 11);
}

export function renderBadge(
  label: string,
  value: string,
  options: CardOptions
): string {
  const accent = `#${options.color}`;
  const fontSize = 11;
  const padding = 8;
  const height = 20;

  const labelWidth = measureText(label, fontSize) + padding * 2;
  const valueWidth = measureText(value, fontSize) + padding * 2;
  const totalWidth = labelWidth + valueWidth;

  const labelX = labelWidth / 2;
  const valueX = labelWidth + valueWidth / 2;
  const textY = 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${accent}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" text-rendering="geometricPrecision">
    <text x="${labelX}" y="${textY}" fill="#010101" fill-opacity=".3">${xmlEscape(label)}</text>
    <text x="${labelX}" y="${textY - 1}">${xmlEscape(label)}</text>
    <text x="${valueX}" y="${textY}" fill="#010101" fill-opacity=".3">${xmlEscape(value)}</text>
    <text x="${valueX}" y="${textY - 1}">${xmlEscape(value)}</text>
  </g>
</svg>`;
}
