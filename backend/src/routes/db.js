import express from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { sendToSlack } from "../services/slack/slackService.js";
import {
  saveMeeting,
  getMeetingByWorkspaceAndTranscript,
  getMeetings,
  getMeetingById,
  saveTasks,
  getTasksByMeeting,
  getTasksByWorkspace,
  updateTask,
  deleteTask,
  addTeamMember,
  getTeamMembers,
  saveIntegration,
  getIntegration,
  getAppUserByLoginId,
} from "../services/db.js";

const router = express.Router();
const inFlightMeetingSaves = new Map();

const normalizeTranscript = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const buildTranscriptKey = (workspaceId, transcript) => {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  const normalizedTranscript = normalizeTranscript(transcript);
  const fingerprint = crypto.createHash("sha256").update(normalizedTranscript).digest("hex");
  return `${normalizedWorkspaceId}:${fingerprint}`;
};

const normalizeTaskText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeTaskDeadline = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const buildTaskKey = (task) => {
  const title = normalizeTaskText(task?.title || task?.task);
  const assignee = normalizeTaskText(task?.assignee || task?.assignee_name || "Unassigned");
  const deadline = normalizeTaskDeadline(task?.deadline);
  return `${title}|${assignee}|${deadline}`;
};

const buildAssigneeCandidates = (user) => {
  const candidates = new Set();
  const add = (value) => {
    const normalized = normalizeTaskText(value);
    if (normalized) candidates.add(normalized);
  };

  add(user?.name);
  add(user?.login_id);

  const loginId = String(user?.login_id || "").trim().toLowerCase();
  const atIndex = loginId.indexOf("@");
  if (atIndex > 0) {
    add(loginId.slice(0, atIndex));
  }

  return candidates;
};

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

    const dedupeKey = buildTranscriptKey(workspaceId, transcript);
    const pending = inFlightMeetingSaves.get(dedupeKey);
    if (pending) {
      const payload = await pending;
      return res.json({ ...payload, duplicate: true });
    }

    const savePromise = (async () => {
      const existingMeeting = await getMeetingByWorkspaceAndTranscript(workspaceId, transcript);
      if (existingMeeting) {
        const existingTasks = await getTasksByMeeting(existingMeeting.id);
        console.log(`[DB] ↺ Duplicate transcript detected, returning existing meeting: ${existingMeeting.id}`);
        return { meeting: existingMeeting, tasks: existingTasks, duplicate: true };
      }

      console.log(`[DB] ➜ Saving meeting...`);

      const meeting = await saveMeeting(workspaceId, title, transcript, workspaceId);
      console.log(`[DB] ✓ Meeting saved: ${meeting.id}`);

      let savedTasks = [];
      if (Array.isArray(tasks) && tasks.length > 0) {
        const existingWorkspaceTasks = await getTasksByWorkspace(workspaceId);
        const existingTaskKeys = new Set((existingWorkspaceTasks || []).map((task) => buildTaskKey(task)));
        const incomingTaskKeys = new Set();

        const tasksToSave = tasks
          .map((task) => ({
            ...task,
            title: String(task?.title || task?.task || "").trim(),
            assignee: String(task?.assignee || task?.assignee_name || "Unassigned").trim() || "Unassigned",
            deadline: task?.deadline || null,
            priority: task?.priority || "medium",
          }))
          .filter((task) => {
            if (!task.title) return false;

            const key = buildTaskKey(task);
            if (incomingTaskKeys.has(key) || existingTaskKeys.has(key)) {
              return false;
            }

            incomingTaskKeys.add(key);
            return true;
          });

        savedTasks = await saveTasks(meeting.id, tasksToSave);
        console.log(`[DB] ✓ Saved ${savedTasks.length} tasks`);
      }

      const isManager = req.auth?.role === "manager" || String(req.auth?.userId || "").toLowerCase().endsWith("@company.com");
      if (isManager && savedTasks.length > 0) {
        try {
          const integration = await getIntegration(workspaceId);
          const webhookUrl = integration?.slack_token || process.env.SLACK_WEBHOOK_URL;

          const slackPayload = {
            meetingTitle: title,
            tasks: savedTasks.map((task) => ({
              title: task.title,
              assignee: task.assignee_name || "Unassigned",
              deadline: task.deadline || null,
              priority: task.priority || "medium",
            })),
          };

          const slackResult = await sendToSlack(slackPayload, { webhookUrl });
          if (slackResult?.sent) {
            console.log(`[DB] ✓ Slack notification sent for meeting: ${meeting.id}`);
          } else {
            console.log(`[DB] ↷ Slack notification skipped: ${slackResult?.reason || "Unknown reason"}`);
          }
        } catch (slackError) {
          console.error("[DB] Slack notification failed:", slackError.message);
        }
      }

      return { meeting, tasks: savedTasks };
    })();

    inFlightMeetingSaves.set(dedupeKey, savePromise);

    try {
      const payload = await savePromise;
      console.log(`[DB] ✅ Success\n`);
      return res.json(payload);
    } finally {
      inFlightMeetingSaves.delete(dedupeKey);
    }
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
    if (req.auth?.role === "employee") {
      const user = await getAppUserByLoginId(req.auth.loginId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const workspaceTasks = await getTasksByWorkspace(req.auth?.userId);
      const assigneeCandidates = buildAssigneeCandidates(user);
      
      const tasks = (workspaceTasks || []).filter((task) => {
        const name = (task?.assignee_name || "").toLowerCase().trim();
        if (!name || name === "unassigned" || name === "undefined" || name === "null") return false;
        return assigneeCandidates.has(name);
      });

      return res.json({ tasks });
    }

    const workspaceId = req.auth?.userId;
    const tasks = await getTasksByWorkspace(workspaceId);
    res.json({ tasks });
  } catch (error) {
    console.error("[tasks] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { status, priority, deadline, assignee_name, assignee } = req.body;
    const updates = {};

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (deadline !== undefined) updates.deadline = deadline;
    
    // Explicitly resolve assignee binding due to column variations
    const resolvedAssignee = assignee || assignee_name;
    if (resolvedAssignee !== undefined) {
      updates.assignee_name = resolvedAssignee;
      updates.assignee = resolvedAssignee;
    }

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
