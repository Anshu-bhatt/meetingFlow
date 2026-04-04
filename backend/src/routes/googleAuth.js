import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAuthUrl, getTokens, createCalendarEvent } from "../services/googleCalendarService.js";
import { supabase } from "../services/db.js";

const router = express.Router();

// Redirect to Google Consent Screen
router.get("/google", requireAuth, (req, res) => {
  const url = getAuthUrl();
  if (!url) {
    return res.status(500).json({ error: "Google OAuth not configured." });
  }
  res.redirect(url);
});

// Handle Callback from Google
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }

    const tokens = await getTokens(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // Use tokens to get user email from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileRes.json();
    const googleEmail = profile.email;

    // Update app_user in DB matching the email
    const { data: user, error } = await supabase
      .from("app_users")
      .update({
        google_access_token: access_token,
        google_refresh_token: refresh_token, // Only exists on first consent
        google_token_expires_at: new Date(expiry_date).toISOString(),
      })
      .eq("login_id", googleEmail)
      .select()
      .single();

    if (error || !user) {
      console.error("[Google Auth] Match failed:", error?.message);
      return res.status(404).send("User account not found or email mismatch.");
    }

    // Redirect to Dashboard
    const frontendUrl = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(",")[0] 
      : "http://localhost:3000";
    const redirectPath = user.role === "manager" ? "/dashboard" : "/employee/dashboard";
    
    res.redirect(`${frontendUrl}${redirectPath}?auth=success`);
  } catch (error) {
    console.error("[Google Auth] Callback error:", error.message);
    res.status(500).send("Authentication failed.");
  }
});

// Manual Sync Task
router.post("/calendar/sync-task/:taskId", requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const loginId = req.auth?.loginId;

    if (!loginId) return res.status(401).json({ error: "User context missing." });

    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("*")
      .eq("login_id", loginId)
      .single();

    if (userError || !user) throw new Error("User not found.");

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) throw new Error("Task not found.");

    const result = await createCalendarEvent(user, task);
    if (!result) {
      return res.status(400).json({ error: "Failed to create event. Is Google account connected?" });
    }

    res.json({ success: true, event: result });
  } catch (error) {
    console.error("[Calendar] Manual sync failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
