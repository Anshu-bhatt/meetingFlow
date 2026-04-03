import { getAppUserBySessionToken, sanitizeAppUser } from "../services/db.js";

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((accumulator, part) => {
    const [rawKey, ...rawValueParts] = part.trim().split("=");
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rawValueParts.join("=") || "");
    return accumulator;
  }, {});
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookies.mf_session;

    if (!sessionToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await getAppUserBySessionToken(sessionToken);

    if (!user) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.auth = sanitizeAppUser(user);
    req.auth.userId = user.login_id;
    next();
  } catch (err) {
    console.error("[auth] Authentication failed:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};