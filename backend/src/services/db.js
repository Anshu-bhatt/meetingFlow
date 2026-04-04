import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL || "https://gyaxydhfengrmsylwrth.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

const AUTH_ITERATIONS = 120000;
const AUTH_KEYLEN = 64;
const AUTH_DIGEST = "sha512";
const AUTH_TABLE = "app_users";
const MANAGER_DOMAIN = "@company.com";
const DEFAULT_AUTH_USERS = [
  { loginId: "manager@company.com", name: "Manager", role: "manager", password: "MeetFlow@123!" },
  { loginId: "manager1@company.com", name: "Manager One", role: "manager", password: "MeetFlow@123!" },
  { loginId: "manager2@company.com", name: "Manager Two", role: "manager", password: "MeetFlow@123!" },
  { loginId: "manager3@company.com", name: "Manager Three", role: "manager", password: "MeetFlow@123!" },
  { loginId: "emp@gmail.com", name: "Employee", role: "employee", password: "MeetFlow@123!" },
  { loginId: "emp1@gmail.com", name: "Employee One", role: "employee", password: "MeetFlow@123!" },
  { loginId: "emp2@gmail.com", name: "Employee Two", role: "employee", password: "MeetFlow@123!" },
  { loginId: "emp3@gmail.com", name: "Employee Three", role: "employee", password: "MeetFlow@123!" },
];

const inferRoleFromLoginId = (loginId) => {
  const normalizedLoginId = String(loginId || "").trim().toLowerCase();
  return normalizedLoginId.endsWith(MANAGER_DOMAIN) ? "manager" : "employee";
};

const buildLoginIdCandidates = (loginId) => {
  const normalizedLoginId = String(loginId || "").trim().toLowerCase();
  if (!normalizedLoginId) return [];

  const candidates = [normalizedLoginId];
  const atIndex = normalizedLoginId.lastIndexOf("@");

  if (atIndex > 0) {
    const localPart = normalizedLoginId.slice(0, atIndex);
    const domainPart = normalizedLoginId.slice(atIndex);
    const strippedLocalPart = localPart.replace(/\d+$/, "");

    if (strippedLocalPart && strippedLocalPart !== localPart) {
      candidates.push(`${strippedLocalPart}${domainPart}`);
    }

    if (localPart && !localPart.endsWith("1")) {
      candidates.push(`${localPart}1${domainPart}`);
    }
  }

  return [...new Set(candidates)];
};

const derivePasswordHash = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, AUTH_ITERATIONS, AUTH_KEYLEN, AUTH_DIGEST).toString("hex");
};

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${derivePasswordHash(password, salt)}`;
};

export const verifyPassword = (password, storedHash) => {
  const [salt, digest] = String(storedHash || "").split(":");
  if (!salt || !digest) return false;
  return derivePasswordHash(password, salt) === digest;
};

export const createSessionToken = () => crypto.randomBytes(32).toString("hex");

export const sanitizeAppUser = (user) => {
  if (!user) return null;

  const {
    password_hash,
    session_token,
    session_expires_at,
    slack_token,
    jira_token,
    jira_base_url,
    clerk_user_id,
    ...safeUser
  } = user;
  return safeUser;
};

export const getAppUserByLoginId = async (loginId) => {
  const candidates = buildLoginIdCandidates(loginId);
  if (!candidates.length) return null;

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from(AUTH_TABLE)
      .select("*")
      .eq("login_id", candidate)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (data) return data;
  }

  return null;
};

export const getAppUserBySessionToken = async (sessionToken) => {
  const normalizedToken = String(sessionToken || "").trim();
  if (!normalizedToken) return null;

  const { data, error } = await supabase
    .from(AUTH_TABLE)
    .select("*")
    .eq("session_token", normalizedToken)
    .gt("session_expires_at", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
};

export const createAppUser = async ({ loginId, name, password, role }) => {
  const normalizedLoginId = String(loginId || "").trim().toLowerCase();
  const normalizedRole = inferRoleFromLoginId(normalizedLoginId) || String(role || "").trim().toLowerCase();
  const passwordHash = hashPassword(password);

  const { data, error } = await supabase
    .from(AUTH_TABLE)
    .insert([
      {
        login_id: normalizedLoginId,
        name: String(name || normalizedLoginId).trim(),
        role: normalizedRole,
        password_hash: passwordHash,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0] || null;
};

export const updateAppUserSession = async (loginId, sessionToken, sessionExpiresAt) => {
  const normalizedLoginId = String(loginId || "").trim().toLowerCase();

  const { data, error } = await supabase
    .from(AUTH_TABLE)
    .update({
      session_token: sessionToken,
      session_expires_at: sessionExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("login_id", normalizedLoginId)
    .select();

  if (error) throw error;
  return data?.[0] || null;
};

export const clearAppUserSession = async (sessionToken) => {
  const normalizedToken = String(sessionToken || "").trim();
  if (!normalizedToken) return null;

  const { data, error } = await supabase
    .from(AUTH_TABLE)
    .update({
      session_token: null,
      session_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("session_token", normalizedToken)
    .select();

  if (error) throw error;
  return data?.[0] || null;
};

export const ensureSeedAuthUsers = async () => {
  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  const seededUsers = [];

  for (const user of DEFAULT_AUTH_USERS) {
    const loginId = String(user.loginId || "").trim().toLowerCase();
    const passwordHash = hashPassword(user.password);

    const { data, error } = await supabase
      .from(AUTH_TABLE)
      .upsert(
        [
          {
            login_id: loginId,
            name: user.name,
            role: user.role,
            password_hash: passwordHash,
            session_token: null,
            session_expires_at: null,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "login_id" }
      )
      .select();

    if (error) throw error;
    if (data?.[0]) {
      seededUsers.push(sanitizeAppUser(data[0]));
    }
  }

  return seededUsers;
};



export const saveMeeting = async (workspaceId, title, transcript, uploadedBy) => {
  const normalizedTranscript = String(transcript || "").trim();

  const { data, error } = await supabase
    .from("meetings")
    .insert([{ workspace_id: workspaceId, title, transcript: normalizedTranscript, uploaded_by: uploadedBy }])
    .select();

  if (error) throw error;
  return data?.[0];
};

export const getMeetingByWorkspaceAndTranscript = async (workspaceId, transcript) => {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  const normalizedTranscript = String(transcript || "").trim();

  if (!normalizedWorkspaceId || !normalizedTranscript) {
    return null;
  }

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", normalizedWorkspaceId)
    .eq("transcript", normalizedTranscript)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (data?.[0]) {
    return data[0];
  }

  const normalizeForCompare = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const { data: candidates, error: candidatesError } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", normalizedWorkspaceId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (candidatesError) throw candidatesError;

  const target = normalizeForCompare(normalizedTranscript);
  return (candidates || []).find((meeting) => normalizeForCompare(meeting.transcript) === target) || null;
};

export const getMeetings = async (workspaceId) => {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if ((data || []).length > 0 || process.env.NODE_ENV === "production") {
    return data || [];
  }

  // Local/dev fallback: show recent meetings even if historical rows used a different workspace_id.
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("meetings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (fallbackError) throw fallbackError;
  return fallbackData || [];
};

export const getMeetingById = async (meetingId) => {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (error) throw error;
  return data;
};



export const saveTasks = async (meetingId, tasks) => {
  const taskRecords = tasks.map((task) => ({
    meeting_id: meetingId,
    title: task.title,
    assignee_name: task.assignee,
    priority: task.priority?.toLowerCase() || "medium",
    status: "pending",
    deadline: task.deadline ? task.deadline.split("T")[0] : null,
  }));

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskRecords)
    .select();

  if (error) throw error;
  return data || [];
};

export const getTasksByMeeting = async (meetingId) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getTasksByWorkspace = async (workspaceId) => {
  // Load meetings for this workspace, then tasks by meeting ids. This avoids
  // fragile PostgREST embed/join naming and matches how the dashboard saves data.
  const meetings = await getMeetings(workspaceId);
  const meetingIds = meetings.map((m) => m.id).filter(Boolean);
  if (meetingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("meeting_id", meetingIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
  return true;
};

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export const addTeamMember = async (workspaceId, name, email, slackUserId, jiraAccountId) => {
  const { data, error } = await supabase
    .from("team_members")
    .insert([
      {
        workspace_id: workspaceId,
        name,
        email,
        slack_user_id: slackUserId,
        jira_account_id: jiraAccountId,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
};

export const getTeamMembers = async (workspaceId) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteTeamMember = async (memberId) => {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
  return true;
};

// ============================================================================
// INTEGRATIONS
// ============================================================================

export const saveIntegration = async (workspaceId, slackToken, jiraToken, jiraBaseUrl) => {
  const { data, error } = await supabase
    .from("integrations")
    .upsert(
      [{ workspace_id: workspaceId, slack_token: slackToken, jira_token: jiraToken, jira_base_url: jiraBaseUrl }],
      { onConflict: "workspace_id" }
    )
    .select();

  if (error) throw error;
  return data?.[0];
};

export const getIntegration = async (workspaceId) => {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
  return data;
};
