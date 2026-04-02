import { generateTasks } from "../services/ai/taskchain.js";

const normalizePriority = (priority) => {
	const value = String(priority || "").toLowerCase();
	if (value === "high") return "High";
	if (value === "low") return "Low";
	return "Medium";
};

const toIsoDate = (value, fallbackDaysOffset = 3) => {
	if (typeof value === "string" && value.trim()) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toISOString();
		}
	}

	return new Date(
		Date.now() + fallbackDaysOffset * 24 * 60 * 60 * 1000
	).toISOString();
};

const normalizeTask = (task, index) => ({
	id: `extracted-${Date.now()}-${index}`,
	title:
		typeof task?.task === "string" && task.task.trim()
			? task.task.trim()
			: "Follow up on meeting action item",
	assignee:
		typeof task?.assignee === "string" && task.assignee.trim()
			? task.assignee.trim()
			: "Unassigned",
	priority: normalizePriority(task?.priority),
	deadline: toIsoDate(task?.deadline, index + 3),
	completed: false,
});

export const extractTasks = async (req, res) => {
	try {
		const { transcript } = req.body;

		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({ error: "Transcript is required" });
		}

		console.log("[extractTasks] Processing transcript:", transcript.substring(0, 50) + "...");
		const rawTasks = await generateTasks(transcript);
		console.log("[extractTasks] Generated raw tasks:", rawTasks);
		const tasks = Array.isArray(rawTasks)
			? rawTasks.map((task, index) => normalizeTask(task, index))
			: [];

		res.json({ tasks });
	} catch (err) {
		console.error("[extractTasks] ERROR:", err.message);
		console.error("[extractTasks] Stack:", err.stack);
		res.status(500).json({ error: err.message || "Something went wrong" });
	}
};
