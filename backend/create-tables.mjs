import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

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

    // Create app_users table
    console.log("5. Creating app_users table...");
    const { error: err5 } = await supabase.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.app_users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          login_id text NOT NULL UNIQUE,
          name text NOT NULL,
          role text NOT NULL CHECK (role IN ('employee', 'manager')),
          password_hash text NOT NULL,
          session_token text UNIQUE,
          session_expires_at timestamptz,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS idx_app_users_login_id ON public.app_users(login_id);
        CREATE INDEX IF NOT EXISTS idx_app_users_session_token ON public.app_users(session_token);
      `
    });
    if (err5) throw err5;
    console.log("   ✓ app_users table created");

    console.log("\n✅ All 5 tables created successfully!");
    console.log("\n📊 Summary:");
    console.log("   • meetings - stores meeting transcripts");
    console.log("   • tasks - stores extracted action items");
    console.log("   • team_members - manages workspace members");
    console.log("   • integrations - stores Slack/Jira credentials");
    console.log("   • app_users - stores login IDs, roles, and sessions");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

createTables();
