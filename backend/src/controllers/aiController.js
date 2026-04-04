import { generateTasks } from "../services/ai/taskchain.js";
import { getIntegration } from "../services/db.js";
import { sendToSlack } from "../services/slack/slackService.js";

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

		const workspaceId = req.auth?.userId;
		if (Array.isArray(result.tasks) && result.tasks.length > 0) {
			try {
				const integration = workspaceId ? await getIntegration(workspaceId) : null;
				const webhookUrl = integration?.slack_token || process.env.SLACK_WEBHOOK_URL;

				const slackPayload = {
					meetingTitle: req.body?.title || "Transcript Extraction",
					meetingSummary: result.meetingSummary || "",
					tasks: result.tasks.map((task) => ({
						title: task.title,
						assignee: task.assignee || "Unassigned",
						deadline: task.deadline || null,
						priority: task.priority || "medium",
					})),
				};

				const slackResult = await sendToSlack(slackPayload, { webhookUrl });
				if (slackResult?.sent) {
					console.log(`[extractTasks] ✓ Slack notification sent (${slackResult.parts || 1} part(s))`);
				} else {
					console.log(`[extractTasks] ↷ Slack notification skipped: ${slackResult?.reason || "Unknown reason"}`);
				}
			} catch (slackError) {
				console.error("[extractTasks] Slack notification failed:", slackError.message);
			}
		}
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
