export function getContrastLevel({ level = "AAA", size = "normal" }): number {
  switch (level) {
    case "wcag2.2AAA": {
      return size === "normal" ? 7 : 4.5;
    }
    case "rgaa4.1":
    case "wcag2.2AA": {
      return size === "normal" ? 4.5 : 3;
    }
    default:
      return 4.1;
  }
}
