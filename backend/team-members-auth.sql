CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS login_id text,
    ADD COLUMN IF NOT EXISTS password_hash text,
    ADD COLUMN IF NOT EXISTS session_token text,
    ADD COLUMN IF NOT EXISTS session_expires_at timestamptz;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'team_members'
        AND indexname = 'idx_team_members_login_id'
) THEN CREATE UNIQUE INDEX idx_team_members_login_id ON public.team_members(login_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename = 'team_members'
        AND indexname = 'idx_team_members_session_token'
) THEN CREATE UNIQUE INDEX idx_team_members_session_token ON public.team_members(session_token);
END IF;
END $$;