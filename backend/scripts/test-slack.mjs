import dotenv from "dotenv";
import { sendToSlack } from "../src/services/slack/slackService.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const samplePayload = {
  meetingTitle: "Slack Integration Test",
  meetingSummary: "This is a test message from MeetingFlow backend.",
  tasks: [
    {
      title: "Follow up with client",
      assignee: "manager1@company.com",
      deadline: "2026-04-10",
      priority: "high",
    },
    {
      title: "Share weekly status update",
      assignee: "emp1@gmail.com",
      deadline: "2026-04-08",
      priority: "medium",
    },
  ],
};

const main = async () => {
  try {
    const result = await sendToSlack(samplePayload);

    if (result?.sent) {
      console.log("Slack test message sent successfully.");
      process.exit(0);
    }

    console.error(`Slack test skipped: ${result?.reason || "Unknown reason"}`);
    process.exit(1);
  } catch (error) {
    console.error("Slack test failed:", error?.message || error);
    process.exit(1);
  }
};

main();
