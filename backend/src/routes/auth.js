import express from "express";
import {
  clearAppUserSession,
  createAppUser,
  createSessionToken,
  getAppUserByLoginId,
  getAppUserBySessionToken,
  sanitizeAppUser,
  updateAppUserSession,
  verifyPassword,
} from "../services/db.js";

const router = express.Router();

const COOKIE_NAME = "mf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MANAGER_DOMAIN = "@company.com";

const allowedRoles = new Set(["employee", "manager"]);

const parseCookieValue = (cookieHeader, cookieName) => {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split("=")
    .slice(1)
    .join("=");
};

const buildSessionCookie = (sessionToken, maxAge = SESSION_TTL_MS) => {
  const isProduction = process.env.NODE_ENV === "production";
  return [
    `${COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    "HttpOnly",
    `SameSite=${isProduction ? "None" : "Lax"}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
};

const clearSessionCookie = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    `SameSite=${isProduction ? "None" : "Lax"}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
};

const redirectForLoginId = (loginId) => {
  const normalizedLoginId = String(loginId || "").trim().toLowerCase();
  return normalizedLoginId.endsWith(MANAGER_DOMAIN) ? "/dashboard" : "/employee/dashboard";
};

const buildAuthResponse = (user) => ({
  user: sanitizeAppUser(user),
  redirectTo: redirectForLoginId(user.login_id),
});

router.post("/signup", async (req, res) => {
  try {
    const loginId = String(req.body.loginId || req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();
    const name = String(req.body.name || loginId || "").trim();
    const role = String(req.body.role || "").trim().toLowerCase();

    if (!loginId || !password || !role) {
      return res.status(400).json({ error: "loginId, password, and role are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ error: "role must be employee or manager" });
    }

    const existingUser = await getAppUserByLoginId(loginId);
    if (existingUser) {
      return res.status(409).json({ error: "Login ID already exists" });
    }

    const user = await createAppUser({ loginId, name, password, role });
    const sessionToken = createSessionToken();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await updateAppUserSession(user.login_id, sessionToken, sessionExpiresAt);

    res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
    return res.status(201).json(buildAuthResponse({ ...user, session_token: sessionToken, session_expires_at: sessionExpiresAt }));
  } catch (error) {
    console.error("[auth] signup failed:", error.message);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const loginId = String(req.body.loginId || req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({ error: "loginId and password are required" });
    }

    const user = await getAppUserByLoginId(loginId);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionToken = createSessionToken();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const updatedUser = await updateAppUserSession(user.login_id, sessionToken, sessionExpiresAt);

    res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
    return res.json(buildAuthResponse({ ...updatedUser, session_token: sessionToken, session_expires_at: sessionExpiresAt }));
  } catch (error) {
    console.error("[auth] login failed:", error.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const sessionToken = parseCookieValue(req.headers.cookie || "", COOKIE_NAME);

    if (sessionToken) {
      await clearAppUserSession(decodeURIComponent(sessionToken));
    }

    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.json({ ok: true });
  } catch (error) {
    console.error("[auth] logout failed:", error.message);
    return res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const sessionToken = parseCookieValue(req.headers.cookie || "", COOKIE_NAME);

    if (!sessionToken) {
      return res.status(200).json({ user: null });
    }

    const user = await getAppUserBySessionToken(decodeURIComponent(sessionToken));

    if (!user) {
      res.setHeader("Set-Cookie", clearSessionCookie());
      return res.status(200).json({ user: null });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("[auth] me failed:", error.message);
    return res.status(500).json({ error: "Unable to load session" });
  }
});

export default router;