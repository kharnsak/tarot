export type Theme = "light" | "dark";
const KEY = "chanjai-theme";
export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* storage unavailable */
  }
  return "light";
}
export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "dark" ? "#120E1F" : "#FBFAF8");
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
}
export function hintSeen(): boolean {
  try {
    return localStorage.getItem("chanjai-hand-hint") === "1";
  } catch {
    return false;
  }
}
export function markHintSeen() {
  try {
    localStorage.setItem("chanjai-hand-hint", "1");
  } catch {
    /* ignore */
  }
}
