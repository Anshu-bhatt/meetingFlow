import { clerkClient } from "@clerk/clerk-sdk-node";

export const requireAuth = (req, res, next) => {
  // Skip auth if no CLERK_SECRET_KEY configured
  if (!process.env.CLERK_SECRET_KEY) {
    return next();
  }

  // Extract Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Verify token with Clerk client
  const token = authHeader.substring(7);
  clerkClient
    .verifyToken(token)
    .then((decoded) => {
      req.auth = { userId: decoded.sub };
      next();
    })
    .catch((err) => {
      res.status(401).json({ error: "Invalid token" });
    });
};