import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  saveMeeting,
  getMeetings,
  getMeetingById,
  saveTasks,
  getTasksByMeeting,
  getTasksByWorkspace,
  updateTask,
  deleteTask,
  addTeamMember,
  getTeamMembers,
  deleteTeamMember,
  saveIntegration,
  getIntegration,
} from "../services/db.js";

const router = express.Router();

// ============================================================================
// MEETINGS
// ============================================================================

// Save meeting with extracted tasks
router.post("/meetings/save", requireAuth, async (req, res) => {
  try {
    const { title, transcript, tasks } = req.body;
    const workspaceId = req.auth?.userId;

    console.log(`\n[DB] POST /meetings/save`);
    console.log(`  workspace_id: ${workspaceId}`);
    console.log(`  Request body:`, { title: title?.substring(0, 50), transcript: transcript?.substring(0, 50), tasksCount: tasks?.length });

    if (!workspaceId || !title || !transcript) {
      console.log(`[DB] ❌ Missing required fields`);
      return res.status(400).json({ error: "Missing required fields: title, transcript" });
    }

    console.log(`[DB] ➜ Saving meeting...`);

    // Save meeting
    const meeting = await saveMeeting(workspaceId, title, transcript, workspaceId);
    console.log(`[DB] ✓ Meeting saved: ${meeting.id}`);

    // Save tasks if provided
    let savedTasks = [];
    if (Array.isArray(tasks) && tasks.length > 0) {
      savedTasks = await saveTasks(meeting.id, tasks);
      console.log(`[DB] ✓ Saved ${savedTasks.length} tasks`);
    }

    console.log(`[DB] ✅ Success\n`);
    res.json({ meeting, tasks: savedTasks });
  } catch (error) {
    console.error(`[DB] ❌ Error:`, error.message);
    console.error(`[DB] Stack:`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Get user's meetings
router.get("/meetings", requireAuth, async (req, res) => {
  try {
    const workspaceId = req.auth?.userId;
    const meetings = await getMeetings(workspaceId);
    res.json({ meetings });
  } catch (error) {
    console.error("[meetings] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get meeting by ID with its tasks
router.get("/meetings/:id", requireAuth, async (req, res) => {
  try {
    const meeting = await getMeetingById(req.params.id);
    const tasks = await getTasksByMeeting(req.params.id);

    res.json({ meeting, tasks });
  } catch (error) {
    console.error("[meetings] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TASKS
// ============================================================================

// Get tasks for a meeting
router.get("/meetings/:meetingId/tasks", requireAuth, async (req, res) => {
  try {
    const tasks = await getTasksByMeeting(req.params.meetingId);
    res.json({ tasks });
  } catch (error) {
    console.error("[tasks] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks in workspace (faster than loading tasks meeting-by-meeting)
router.get("/tasks", requireAuth, async (req, res) => {
  try {
    const workspaceId = req.auth?.userId;
    const tasks = await getTasksByWorkspace(workspaceId);
    res.json({ tasks });
  } catch (error) {
    console.error("[tasks] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.put("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { status, priority, deadline, assignee_name } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (deadline) updates.deadline = deadline;
    if (assignee_name) updates.assignee_name = assignee_name;

    const task = await updateTask(req.params.id, updates);
    res.json({ task });
  } catch (error) {
    console.error("[tasks] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("[tasks] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TEAM MEMBERS
// ============================================================================

// Add team member
router.post("/team-members", requireAuth, async (req, res) => {
  try {
    const { name, email, slack_user_id, jira_account_id } = req.body;
    const workspaceId = req.auth?.userId;

    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields: name, email" });
    }

    const member = await addTeamMember(workspaceId, name, email, slack_user_id, jira_account_id);
    res.json({ member });
  } catch (error) {
    console.error("[team-members] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get team members
router.get("/team-members", requireAuth, async (req, res) => {
  try {
    const workspaceId = req.auth?.userId;
    const members = await getTeamMembers(workspaceId);
    res.json({ members });
  } catch (error) {
    console.error("[team-members] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete team member
router.delete("/team-members/:id", requireAuth, async (req, res) => {
  try {
    await deleteTeamMember(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("[team-members] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INTEGRATIONS
// ============================================================================

// Save integration credentials
router.post("/integrations", requireAuth, async (req, res) => {
  try {
    const { slack_token, jira_token, jira_base_url } = req.body;
    const workspaceId = req.auth?.userId;

    const integration = await saveIntegration(workspaceId, slack_token, jira_token, jira_base_url);
    res.json({ integration });
  } catch (error) {
    console.error("[integrations] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get integration
router.get("/integrations", requireAuth, async (req, res) => {
  try {
    const workspaceId = req.auth?.userId;
    const integration = await getIntegration(workspaceId);
    res.json({ integration });
  } catch (error) {
    console.error("[integrations] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
