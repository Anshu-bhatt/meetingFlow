import { google } from "googleapis";
import { supabase } from "./db.js";

const oauth2Client = (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) 
  ? new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
    )
  : null;

export const getAuthUrl = () => {
  if (!oauth2Client) return null;
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

export const getTokens = async (code) => {
  if (!oauth2Client) throw new Error("Google OAuth client not configured.");
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const refreshAccessTokenIfNeeded = async (user) => {
  const { google_access_token, google_refresh_token, google_token_expires_at, login_id } = user;

  if (!google_refresh_token || !oauth2Client) return google_access_token;

  const now = new Date();
  const expiresAt = new Date(google_token_expires_at);

  // Buffer: refresh if expires in less than 5 minutes
  if (expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    return google_access_token;
  }

  console.log(`[Google] Refreshing token for user: ${login_id}`);
  oauth2Client.setCredentials({ refresh_token: google_refresh_token });

  const { credentials } = await oauth2Client.refreshAccessToken();
  const { access_token, expiry_date } = credentials;

  // Update DB
  await supabase
    .from("app_users")
    .update({
      google_access_token: access_token,
      google_token_expires_at: new Date(expiry_date).toISOString(),
    })
    .eq("login_id", login_id);

  return access_token;
};

export const createCalendarEvent = async (user, task) => {
  try {
    if (!oauth2Client) {
      console.log("[Google] No CLIENT ID/SECRET, skipping calendar sync.");
      return null;
    }

    const accessToken = await refreshAccessTokenIfNeeded(user);
    if (!accessToken) {
      console.log(`[Google] Skipping calendar sync for ${user.login_id}: No access token.`);
      return null;
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // Format times: start = due_date - 1h, end = due_date
    // Deadline is stored as 'YYYY-MM-DD', default to 10:00 AM if no time component
    const deadlineStr = task.deadline || task.due_date;
    if (!deadlineStr) return null;

    const baseDate = new Date(deadlineStr);
    if (deadlineStr.length <= 10) {
      // It's just a date, set a default time (10 AM)
      baseDate.setHours(10, 0, 0, 0);
    }

    const startTime = new Date(baseDate.getTime() - 60 * 60 * 1000);
    const endTime = baseDate;

    const event = {
      summary: task.title,
      description: task.description || "Generated Action Item from MeetFlow",
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      attendees: user.login_id ? [{ email: user.login_id }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 24 * 60 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log(`[Google] Event created: ${response.data.htmlLink}`);

    // Update task with event ID
    await supabase
      .from("tasks")
      .update({ google_event_id: response.data.id })
      .eq("id", task.id);

    return response.data;
  } catch (error) {
    console.error("[Google] Event creation failed:", error.message);
    return null;
  }
};
