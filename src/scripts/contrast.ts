import { Color } from "./types";

export function getContrast(
  text: Color["code"],
  background: Color["code"]
): number {
  const c1 = { r: text.values[0], g: text.values[1], b: text.values[2] };
  const c2 = {
    r: background.values[0],
    g: background.values[1],
    b: background.values[2],
  };

  const l1 = luminance([c1?.r, c1?.g, c1?.b]);
  const l2 = luminance([c2?.r, c2?.g, c2?.b]);

  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}

function luminance(color): number {
  const r = relativeLuminance(color[0]);
  const g = relativeLuminance(color[1]);
  const b = relativeLuminance(color[2]);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function relativeLuminance(value: number): number {
  const ratio = value / 255;

  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

export function getContrastLevel({ level = "AAA", size = "normal" }): number {
  switch (level) {
    case "wcag2.2AAA": {
      return size === "normal" ? 7 : 4.5;
    }
    case "rgaa4.1":
    case "raam.1":
    case "wcag2.2AA": {
      return size === "normal" ? 4.5 : 3;
    }
    default:
      return 4.1;
  }
}
