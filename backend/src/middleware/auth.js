import { getAppUserBySessionToken } from "../services/db.js";

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

    if (sessionToken) {
      const user = await getAppUserBySessionToken(sessionToken);
      if (user?.login_id) {
        req.auth = {
          userId: user.login_id,
          loginId: user.login_id,
          role: user.role || null,
        };
        return next();
      }
    }

    // Local fallback for non-session flows.
    const workspaceHeader = req.header("x-workspace-id");
    const workspaceId =
      typeof workspaceHeader === "string" && workspaceHeader.trim()
        ? workspaceHeader.trim()
        : "workspace_local_default";

    req.auth = { userId: workspaceId };
    next();
  } catch (err) {
    console.error("[auth] Failed to resolve workspace identity:", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};