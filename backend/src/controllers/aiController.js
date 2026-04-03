import { generateTasks } from "../services/ai/taskchain.js";

export const extractTasks = async (req, res) => {
	try {
		const { transcript } = req.body;

		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({ error: "Transcript is required" });
		}

		console.log("[extractTasks] ════════════════════════════════════════");
		console.log("[extractTasks] Processing transcript:", transcript.substring(0, 80) + "...");
		const result = await generateTasks(transcript);

		console.log("[extractTasks] ✅ Result received");
		console.log("[extractTasks] - Total tasks:", result.tasks?.length || 0);
		console.log("[extractTasks] - Speakers detected:", result.speakers_detected || []);
		console.log("[extractTasks] - High priority count:", result.highPriorityCount);

		// Log each task with assignee
		result.tasks?.forEach((task, i) => {
			console.log(`[extractTasks] Task ${i + 1}: "${task.title.substring(0, 50)}..." → ${task.assignee || "Unassigned"}`);
		});
		console.log("[extractTasks] ════════════════════════════════════════\n");

		res.json({
			tasks: result.tasks || [],
			meetingSummary: result.meetingSummary || "",
			totalTasks: result.totalTasks ?? (result.tasks || []).length,
			highPriorityCount: result.highPriorityCount ?? (result.tasks || []).filter((task) => task.priority === "High").length,
			speakers_detected: result.speakers_detected || [],
		});
	} catch (err) {
		console.error("[extractTasks] ❌ ERROR:", err.message);
		console.error("[extractTasks] Stack:", err.stack);
		res.status(500).json({ error: err.message || "Something went wrong" });
	}
};
