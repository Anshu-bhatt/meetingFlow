import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const clerkRequireAuth = ClerkExpressRequireAuth();

export const requireAuth = (req, res, next) => {
	if (!process.env.CLERK_SECRET_KEY) {
		return next();
	}

	return clerkRequireAuth(req, res, next);
};
