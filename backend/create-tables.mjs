import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://gyaxydhfengrmsylwrth.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXh5ZGhmZW5ncm1zeWx3cnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEyNjMwMzcsImV4cCI6MTgxNzUyOTAzN30.i7DIyJqgx8-V4YF8qqJBWyuJw6Zl8K9V8dQKF0rS0vQ";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXh5ZGhmZW5ncm1zeWx3cnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTI2MzAzNywiZXhwIjoxODE3NTI5MDM3fQ.EBYoSqk8sMN5IKgYTGN7PSVVPWrpI8xv3NVokA9xVhM";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTables() {
  try {
    console.log("📝 Creating tables in Supabase...\n");
    
    // Create meetings table
    console.log("1. Creating meetings table...");
    const { error: err1 } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.meetings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id text NOT NULL,
          title text NOT NULL,
          transcript text,
          created_at timestamptz DEFAULT now(),
          uploaded_by text,
          updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS idx_meetings_workspace_id ON public.meetings(workspace_id);
      `
    });
    if (err1) throw err1;
    console.log("   ✓ meetings table created");

    // Create tasks table
    console.log("2. Creating tasks table...");
    const { error: err2 } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tasks (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
          title text NOT NULL,
          assignee_name text,
          priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
          status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
          deadline date,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON public.tasks(meeting_id);
      `
    });
    if (err2) throw err2;
    console.log("   ✓ tasks table created");

    // Create team_members table
    console.log("3. Creating team_members table...");
    const { error: err3 } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.team_members (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id text NOT NULL,
          name text NOT NULL,
          email text,
          slack_user_id text,
          jira_account_id text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          UNIQUE(workspace_id, email)
        );
        ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS idx_team_members_workspace_id ON public.team_members(workspace_id);
      `
    });
    if (err3) throw err3;
    console.log("   ✓ team_members table created");

    // Create integrations table
    console.log("4. Creating integrations table...");
    const { error: err4 } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.integrations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id text NOT NULL UNIQUE,
          slack_token text,
          jira_token text,
          jira_base_url text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.integrations DISABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON public.integrations(workspace_id);
      `
    });
    if (err4) throw err4;
    console.log("   ✓ integrations table created");

    console.log("\n✅ All 4 tables created successfully!");
    console.log("\n📊 Summary:");
    console.log("   • meetings - stores meeting transcripts");
    console.log("   • tasks - stores extracted action items");
    console.log("   • team_members - manages workspace members");
    console.log("   • integrations - stores Slack/Jira credentials");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

createTables();
