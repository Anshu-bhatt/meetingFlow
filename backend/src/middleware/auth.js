export const requireAuth = async (req, res, next) => {
  try {
    const workspaceHeader = req.header("x-workspace-id");
    const workspaceId =
      typeof workspaceHeader === "string" && workspaceHeader.trim()
        ? workspaceHeader.trim()
        : "workspace_local_default";

    req.auth = { userId: workspaceId };
    next();
  } catch (err) {
    console.error("[auth] Failed to resolve workspace identity:", err.message);
    req.auth = { userId: "workspace_local_default" };
    next();
  }
};