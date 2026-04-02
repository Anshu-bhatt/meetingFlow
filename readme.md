# MeetFlow

MeetFlow is an AI-powered meeting workflow app with a Next.js frontend and an Express backend.
It helps teams extract structured tasks from meeting notes, manage those tasks, and integrate workflows with services like Slack.

## Project Structure

```text
MeetFlow/
  backend/      # Express API (auth, AI extraction, task/meeting services)
  frontend/     # Next.js app (landing, auth, dashboard)
  package.json  # npm workspaces root
```

## Tech Stack

- Frontend: Next.js, React, TypeScript, Clerk, Tailwind CSS
- Backend: Node.js, Express, Clerk SDK, LangChain + Groq, Supabase
- Integrations: Slack webhook notifications

## Prerequisites

Install these before starting:

- Node.js 20+ (LTS recommended)
- npm 10+
- Clerk account (publishable + secret keys)
- Supabase project (URL + service role key)
- Groq API key
- Slack incoming webhook (optional but recommended)

## Environment Setup

### 1) Backend environment

Create `backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
CLERK_SECRET_KEY=your_clerk_secret_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 2) Frontend environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Install Dependencies

From the project root:

```bash
npm install
```

This uses npm workspaces and installs dependencies for both `frontend` and `backend`.

## Run the Project (Development)

Use two terminals.

### Terminal 1: Start Backend API

```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

## First-Time Workflow

1. Open `http://localhost:3000`.
2. Sign up or sign in through Clerk.
3. Navigate to the dashboard.
4. Paste meeting notes/transcript in the AI input section.
5. Trigger task extraction.
6. Review extracted tasks and continue with task management flow.

## Core Service Flow

1. User authenticates in frontend via Clerk.
2. Frontend calls backend API (`/api/ai/...`) using `NEXT_PUBLIC_API_URL`.
3. Backend validates auth and request payload.
4. AI service sends prompt to Groq via LangChain.
5. Parsed tasks are returned and can be persisted via Supabase services.
6. Optional notifications can be sent via Slack webhook.

## Useful Commands

### Backend

```bash
npm run dev
```

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Troubleshooting

### Frontend cannot reach backend

- Ensure backend is running on port `5000`.
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- Verify CORS origin with `FRONTEND_URL` in `backend/.env`.

### Auth errors

- Check Clerk keys:
  - `CLERK_SECRET_KEY` in backend
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in frontend

### AI extraction fails

- Confirm `GROQ_API_KEY` is set and valid.
- Check backend logs for model/API errors.

### Database issues

- Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Validate table schema and permissions in Supabase.

## Production Notes

Before deploying:

- Replace localhost URLs with production domains.
- Rotate all secrets and store them in your hosting platform secret manager.
- Set strict CORS origin(s).
- Enable monitoring/logging for backend API and frontend runtime.

## License

No explicit license is currently defined in this repository. Add a `LICENSE` file before public distribution.
