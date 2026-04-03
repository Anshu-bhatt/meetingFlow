import { generateTasks } from "../services/ai/taskchain.js";

export const extractTasks = async (req, res) => {
	try {
		const { transcript } = req.body;

		if (!transcript || typeof transcript !== "string") {
			return res.status(400).json({ error: "Transcript is required" });
		}

		console.log("[extractTasks] Processing transcript:", transcript.substring(0, 50) + "...");
		const result = await generateTasks(transcript);
		console.log("[extractTasks] Generated result:", result);

		res.json({
			tasks: result.tasks || [],
			meetingSummary: result.meetingSummary || "",
			totalTasks: result.totalTasks ?? (result.tasks || []).length,
			highPriorityCount: result.highPriorityCount ?? (result.tasks || []).filter((task) => task.priority === "High").length,
		});
	} catch (err) {
		console.error("[extractTasks] ERROR:", err.message);
		console.error("[extractTasks] Stack:", err.stack);
		res.status(500).json({ error: err.message || "Something went wrong" });
	}
};
