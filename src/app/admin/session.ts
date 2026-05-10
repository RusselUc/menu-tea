const AUTH_KEY = "tea_admin_auth";
const SESSION_DAYS = 30;

export function setAdminSession() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ v: "1", exp }));
}

export function checkAdminSession(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const { v, exp } = JSON.parse(raw);
    if (v !== "1" || Date.now() > exp) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return false;
  }
}
