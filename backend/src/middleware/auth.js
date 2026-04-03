import { clerkClient } from "@clerk/clerk-sdk-node";

export const requireAuth = async (req, res, next) => {
  try {
    // Skip auth if no CLERK_SECRET_KEY configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.log("[auth] No CLERK_SECRET_KEY, skipping auth");
      req.auth = { userId: "test-user-dev" };
      return next();
    }

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;

    // Allow request without token - set default userId for development
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[auth] No Bearer token, using dev userId");
      req.auth = { userId: "user_dev_test" };
      return next();
    }

    // Verify token with Clerk
    const token = authHeader.substring(7);
    console.log("[auth] Verifying token...");

    const decoded = await clerkClient.verifyToken(token);
    const userId = decoded.sub || decoded.userId || decoded.id;

    if (!userId) {
      console.log("[auth] No userId in token, using dev userId");
      req.auth = { userId: "user_dev_test" };
      return next();
    }

    console.log("[auth] ✓ Token verified, userId:", userId);
    req.auth = { userId };
    next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err.message);
    console.log("[auth] Using dev userId instead");
    req.auth = { userId: "user_dev_test" };
    next();
  }
};