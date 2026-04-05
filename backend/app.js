import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import aiRoutes from "./src/routes/ai.js";
import authRoutes from "./src/routes/auth.js";
import googleAuthRoutes from "./src/routes/googleAuth.js";
import meetingRoute from "./src/routes/meetingRoute.js";
import { ensureSeedAuthUsers, supabase } from "./src/services/db.js";
import { sendEmailReminder } from "./src/services/notificationService.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://meeting-flow-frontend-git-main-anshu-bhatts-projects.vercel.app"
];
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
const isTrustedVercelOrigin = (origin) => /^https:\/\/([\w-]+\.)?vercel\.app$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      isTrustedVercelOrigin(origin) ||
      (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  optionsSuccessStatus: 204,
};

app.use(express.json());

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes); // Google OAuth routes
app.use("/api", meetingRoute);

// CRON JOB: Check for tasks due within 48 hours every 4 hours
cron.schedule("0 */4 * * *", async () => {
  console.log("[Cron] Running 48h task reminder check...");
  try {
    const fortyEightHoursFromNow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Query pending tasks due in <= 48 hours
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*, meetings(uploaded_by)")
      .neq("status", "completed")
      .lte("deadline", fortyEightHoursFromNow.split("T")[0])
      .gte("deadline", now.split("T")[0]);

    if (error) throw error;

    for (const task of tasks) {
      // Find the user to notify. Priority: assignee_name matching user name or email.
      // If no match, notify the meeting uploader.
      const { data: users } = await supabase
        .from("app_users")
        .select("login_id, name")
        .or(`name.ilike.${task.assignee_name},login_id.ilike.${task.assignee_name}`);

      const targetEmail = users?.[0]?.login_id || task.assignee_name || task.meetings?.uploaded_by;

      if (targetEmail && targetEmail.includes("@")) {
        await sendEmailReminder(targetEmail, task);
      }
    }
  } catch (err) {
    console.error("[Cron] Task reminder job failed:", err.message);
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureSeedAuthUsers();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to seed auth users:", error.message);
    process.exit(1);
  }
};

startServer();
