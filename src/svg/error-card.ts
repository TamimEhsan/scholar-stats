import { xmlEscape } from "../security";
import { CardOptions } from "../types";

export function renderErrorCard(
  message: string,
  options: CardOptions
): string {
  const isDark = options.theme === "dark";
  const bg = isDark ? "#0d1117" : "#ffffff";
  const border = isDark ? "#30363d" : "#e4e2e2";
  const textColor = isDark ? "#c9d1d9" : "#333333";
  const titleColor = isDark ? "#f85149" : "#e05d44";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="120" viewBox="0 0 495 120" fill="none">
  <rect x="0.5" y="0.5" width="494" height="119" rx="4.5" fill="${bg}" stroke="${border}"/>
  <text x="25" y="40" font-family="Segoe UI, Ubuntu, Helvetica Neue, sans-serif" font-size="16" font-weight="600" fill="${titleColor}">Error</text>
  <text x="25" y="75" font-family="Segoe UI, Ubuntu, Helvetica Neue, sans-serif" font-size="14" fill="${textColor}">${xmlEscape(message)}</text>
</svg>`;
}
