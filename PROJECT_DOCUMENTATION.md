# MeetFlow Project Documentation

Last updated: April 4, 2026

## 1) Project Summary

MeetFlow is a full-stack meeting operations platform that converts meeting transcripts into actionable tasks, supports manager and employee role-based dashboards, and sends task updates to Slack.

Core goals:

- Extract tasks and assignees from transcript text
- Let managers review and save extracted tasks to the database
- Let employees view only their own assigned tasks
- Keep task data deduplicated and synced across dashboards

## 2) Current Architecture

### Frontend

- Next.js App Router application
- Dashboard for managers at /dashboard
- Employee dashboard at /employee/dashboard
- Custom sign-in/sign-up pages using backend auth APIs

### Backend

- Express API server
- Route groups:
  - /api/auth
  - /api/ai
  - /api (meetings, tasks, team, integrations)
  - /api/transcribe
- CORS with local-dev origin support
- Cookie-based sessions

### Database

- Supabase PostgreSQL
- Main entities:
  - app_users
  - meetings
  - tasks
  - team_members
  - integrations

## 3) Authentication and Role Model

The project now uses custom authentication (not Clerk runtime auth):

- Session cookie name: mf_session
- Login/signup via backend /api/auth routes
- Roles: manager, employee
- Role redirect behavior:
  - manager -> /dashboard
  - employee -> /employee/dashboard

Stability updates implemented:

- Login supports short IDs and full IDs (for example emp1 and emp1@gmail.com)
- Seed users are inserted only when missing and are no longer overwritten on every restart

## 4) AI Extraction Pipeline

Task extraction flow:

1. Transcript submitted to /api/ai/extract-tasks
2. Multi-stage LLM chain runs cleaning, extraction, and validation
3. Output normalized to task objects with:
   - title
   - assignee
   - priority
   - deadline
4. Response returned to frontend as extracted preview

Assignee quality improvements implemented:

- Better speaker detection from transcript labels
- Support for emp1, emp2 style speaker IDs
- Stopword filtering to prevent false speaker detection (for example we, where)
- Additional sentence-pattern assignee inference

## 5) Save Flow and Deduplication

Current manager flow:

- Extract action does not save to DB
- Save happens only when user clicks Save All Tasks

Deduplication protections:

- In-flight save lock for same transcript per workspace
- Duplicate transcript detection per workspace
- Duplicate task prevention using normalized key:
  - title + assignee + deadline
- Save result returns only newly inserted tasks

## 6) Employee Dashboard Task Scope

Employee dashboard task source:

- Frontend fetches /api/tasks after validating employee session
- Backend filters employee tasks by:
  - current workspace
  - current assignee identity
- Unassigned/undefined assignee tasks are excluded for employee role

This ensures Employee One sees only tasks assigned to Employee One in their workspace.

## 7) Slack Integration

Slack notifications are implemented in two places:

- On direct transcript extraction (extract route)
- On manager save flow for newly saved tasks

Slack payload includes:

- Meeting title and summary
- Task title
- Assignee
- Deadline
- Priority

Reliability behavior:

- Workspace integration webhook preferred
- Environment webhook fallback supported
- Large task lists are chunked into multiple Slack posts

## 8) Transcription and Upload

- Backend transcribe route is active
- Upload -> transcription -> extraction flow is integrated
- Meeting persistence uses workspace-aware fields

## 9) Frontend Behavior Updates Implemented

- Extracted tasks remain in preview until explicit save
- Save toast reports inserted count and duplicate-only saves
- Task table is hardened against missing assignee values
- Employee dashboard maps backend assignee_name to UI assignee field

## 10) API Surface (Current)

Auth

- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

AI

- POST /api/ai/extract-tasks

Meetings/Tasks

- POST /api/meetings/save
- GET /api/meetings
- GET /api/meetings/:id
- GET /api/meetings/:meetingId/tasks
- GET /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

Team/Integrations

- POST /api/team-members
- GET /api/team-members
- DELETE /api/team-members/:id
- POST /api/integrations
- GET /api/integrations

Transcription

- Routes mounted under /api/transcribe

## 11) Tech Stack

Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui component system
- Sonner (toast notifications)
- date-fns

Backend

- Node.js
- Express
- dotenv
- cors
- multer (file upload handling in transcription flow)
- axios (Slack posting)

AI/LLM

- LangChain
- Groq models
- Google Generative AI models
- Prompt chaining with cleaner/extractor/validator stages

Data Layer

- Supabase JavaScript SDK
- Supabase PostgreSQL

Auth/Security

- Cookie-based session auth
- PBKDF2 password hashing (crypto)
- Role-based route behavior (manager/employee)

External Integrations

- Slack Incoming Webhooks
- Supabase-hosted PostgreSQL

## 12) Known Operational Notes

- Local startup has had recurring dev-server restarts/port/process churn in this workspace history.
- Ensure one backend and one frontend dev process are running at a time.
- Keep secrets only in local env files and never in tracked documentation/example secrets.

## 13) Recommended Next Steps

- Add endpoint-level authorization checks for employee task update/delete ownership
- Add integration tests for:
  - auth login variants
  - save dedupe behavior
  - employee task scope filtering
- Add structured logging around extraction-to-slack pipeline
