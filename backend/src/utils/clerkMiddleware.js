const requireAuth = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || 'workspace_local_default';
    req.userId = workspaceId;
    next();
  } catch (err) {
    req.userId = 'workspace_local_default';
    next();
  }
};

module.exports = { requireAuth };