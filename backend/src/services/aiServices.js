const ACTION_KEYWORDS = [
	"need to",
	"will",
	"should",
	"must",
	"has to",
	"going to",
	"review",
	"schedule",
	"update",
	"prepare",
	"send",
	"create",
	"finish",
];

const KNOWN_NAMES = ["John", "Sarah", "Mike", "Alex", "Emily"];

const fullNameFromFirstName = (name) => {
	if (name === "John") return "John Doe";
	if (name === "Sarah") return "Sarah Smith";
	if (name === "Mike") return "Mike Johnson";
	if (name === "Alex") return "Alex Chen";
	return "Emily Brown";
};

export const generateTasks = async (transcript) => {
	const sentences = transcript
		.split(/[.!?]+/)
		.map((s) => s.trim())
		.filter(Boolean);

	const extracted = [];

	sentences.forEach((sentence, index) => {
		const lower = sentence.toLowerCase();
		const hasAction = ACTION_KEYWORDS.some((keyword) => lower.includes(keyword));

		if (!hasAction || sentence.length < 10) {
			return;
		}

		let assignee = "Unassigned";
		for (const name of KNOWN_NAMES) {
			if (sentence.includes(name)) {
				assignee = fullNameFromFirstName(name);
				break;
			}
		}

		let priority = "Medium";
		if (
			lower.includes("urgent") ||
			lower.includes("asap") ||
			lower.includes("immediately") ||
			lower.includes("critical")
		) {
			priority = "High";
		} else if (
			lower.includes("when possible") ||
			lower.includes("low priority") ||
			lower.includes("eventually")
		) {
			priority = "Low";
		}

		extracted.push({
			id: `extracted-${Date.now()}-${index}`,
			title: sentence,
			assignee,
			priority,
			deadline: new Date(
				Date.now() + (index + 3) * 24 * 60 * 60 * 1000
			).toISOString(),
			completed: false,
		});
	});

	if (extracted.length === 0) {
		return [
			{
				id: `extracted-${Date.now()}-1`,
				title: "Review meeting notes and extract action items",
				assignee: "Unassigned",
				priority: "Medium",
				deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
				completed: false,
			},
			{
				id: `extracted-${Date.now()}-2`,
				title: "Share meeting summary with team",
				assignee: "Unassigned",
				priority: "Low",
				deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
				completed: false,
			},
		];
	}

	return extracted;
};

