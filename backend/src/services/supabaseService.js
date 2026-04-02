import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Insert tasks
export const insertTasks = async (tasks, userId) => {
const formatted = tasks.map(t => ({
task: t.task,
assignee: t.assignee || "Unassigned",
deadline: t.deadline || null,
priority: t.priority || "Medium",
status: "todo",
user_id: userId
}));

const { data, error } = await supabase
.from("tasks")
.insert(formatted)
.select();

if (error) throw error;
return data;
};

// Get tasks by user
export const getTasksByUser = async (userId) => {
const { data, error } = await supabase
.from("tasks")
.select("*")
.eq("user_id", userId)
.order("created_at", { ascending: false });

if (error) throw error;
return data;
};
