import { createClient } from "@supabase/supabase-js";

const hasSupabaseConfig =
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export const saveTranscriptMeeting = async ({ userId, title, transcript }) => {
  if (!transcript || typeof transcript !== "string") {
    return { meetingId: null, persisted: false };
  }

  // In local mode (without Supabase), keep transcription functional without persistence.
  if (!supabase) {
    return { meetingId: null, persisted: false };
  }

  const payload = {
    title: title || "Uploaded meeting",
    transcript,
    user_id: userId || null,
  };

  const { data, error } = await supabase
    .from("meetings")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    meetingId: data?.id ?? null,
    persisted: Boolean(data?.id),
  };
};
