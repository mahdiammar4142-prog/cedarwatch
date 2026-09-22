const GATE_KEY = "cedarwatch.gatePassed";

export function markGatePassed() {
  try {
    localStorage.setItem(GATE_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

export function hasPassedGate() {
  try {
    return localStorage.getItem(GATE_KEY) === "1";
  } catch {
    return false;
  }
}

export function sanitizeReturnPath(path: unknown): string {
  if (typeof path !== "string") return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  if (path === "/login" || path === "/signup" || path.startsWith("/login?") || path.startsWith("/signup?")) {
    return "/";
  }
  return path;
}
