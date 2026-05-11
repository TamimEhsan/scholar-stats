import { xmlEscape } from "../security";

const CHAR_WIDTHS: Record<string, number> = {
  narrow: 4.5,   // i l j , . : ; ! |
  normal: 7.5,   // most lowercase
  wide: 9,       // m w M W
  upper: 8.5,    // most uppercase
  space: 3.5,
};

function estimateCharWidth(ch: string, fontSize: number): number {
  const scale = fontSize / 13;
  if (ch === " ") return CHAR_WIDTHS.space * scale;
  if ("iljt,.;:!|'".includes(ch)) return CHAR_WIDTHS.narrow * scale;
  if ("mwMWDOQG@".includes(ch)) return CHAR_WIDTHS.wide * scale;
  if (ch >= "A" && ch <= "Z") return CHAR_WIDTHS.upper * scale;
  return CHAR_WIDTHS.normal * scale;
}

function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += estimateCharWidth(ch, fontSize);
  }
  return width;
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      if (estimateTextWidth(word, fontSize) > maxWidth) {
        let partial = "";
        for (const ch of word) {
          if (estimateTextWidth(partial + ch + "…", fontSize) > maxWidth) {
            lines.push(partial + "…");
            partial = "";
          }
          partial += ch;
        }
        currentLine = partial;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

export function renderWrappedText(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  cssClass: string
): { svg: string; endY: number } {
  let svg = "";
  let y = startY;
  for (const line of lines) {
    svg += `\n  <text x="${x}" y="${y}" class="${cssClass}">${xmlEscape(line)}</text>`;
    y += lineHeight;
  }
  return { svg, endY: y };
}
