import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://gyaxydhfengrmsylwrth.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);



export const saveMeeting = async (workspaceId, title, transcript, uploadedBy) => {
  const { data, error } = await supabase
    .from("meetings")
    .insert([{ workspace_id: workspaceId, title, transcript, uploaded_by: uploadedBy }])
    .select();

  if (error) throw error;
  return data?.[0];
};

export const getMeetings = async (workspaceId) => {
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from("tasks")
    .select("*, meetings!inner(workspace_id)")
    .eq("meetings.workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(({ meetings, ...task }) => task);
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
