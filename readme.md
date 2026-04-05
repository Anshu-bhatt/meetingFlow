# MeetFlow

MeetFlow is an AI-powered meeting execution platform that turns transcripts into clear, trackable action items.
It helps teams move from discussion to delivery with better ownership and faster follow-through.

## Live Deployment

Frontend on Vercel:
https://meeting-flow-frontend-git-main-anshu-bhatts-projects.vercel.app/

Backend on Render:
Deploy from this repository using the configuration in render.yaml.

## Project Description

Most teams lose momentum after meetings because tasks are not captured clearly, owners are not explicit, and follow-ups are inconsistent.
MeetFlow solves this with a structured flow:

1. Capture transcript or meeting notes.
2. Extract tasks with AI.
3. Assign owners and priorities.
4. Save and track execution in one dashboard.

## Project Impact

MeetFlow improves team execution by:

- Reducing action items lost in chats or personal notes.
- Converting unstructured discussion into actionable tasks.
- Increasing accountability through clear ownership.
- Reducing repeated discussions in future meetings.
- Improving post-meeting visibility across teams.

## Core Features

- AI task extraction from transcript text.
- Structured task output with title, assignee, priority, and deadline.
- Meeting and task persistence with Supabase.
- Dashboard for reviewing and managing extracted tasks.
- Authentication and protected routes for user access.
- Integration-ready backend for communication and workflow extensions.

## Product Workflow

1. User pastes transcript text in the dashboard.
2. Frontend sends request to backend extraction API.
3. Backend processes transcript with AI and fallback logic.
4. Structured tasks are returned to frontend.
5. User reviews, edits, and saves tasks.
6. Tasks are available for execution tracking.

## Tech Stack

Frontend:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

Backend:
- Node.js
- Express 5
- LangChain-based extraction pipeline
- Supabase

Deployment:
- Vercel for frontend
- Render for backend

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### 1) Clone and Install

- git clone <your-repo-url>
- cd MeetFlow
- npm install

### 2) Configure Environment

Backend env file:
- Path: backend/.env
- Reference template: backend/.env.example

Frontend env file:
- Path: frontend/.env.local
- Required variable:

NEXT_PUBLIC_API_URL=http://localhost:5000

### 3) Run Backend

- npm run dev --workspace backend

Backend default URL:
http://localhost:5000

### 4) Run Frontend

- npm run dev --workspace frontend

Frontend default URL:
http://localhost:3000

### 5) Validate Basic Flow

- Open frontend URL.
- Sign in.
- Go to dashboard.
- Paste transcript.
- Run extraction.
- Save generated tasks.

## Deployment Guide

For full deployment steps, see:
DEPLOYMENT_GUIDE.md

Quick deployment summary:

1. Deploy backend to Render from backend root settings.
2. Deploy frontend to Vercel from frontend root settings.
3. Set frontend variable NEXT_PUBLIC_API_URL to your Render backend URL.
4. Set backend variable FRONTEND_URL to your Vercel frontend domain.
5. Redeploy backend after updating CORS origin.

## API Example

Primary extraction endpoint:

POST /api/ai/extract-tasks
Content-Type: application/json

Example request:

{
  "transcript": "John will finalize API docs by Friday. Sarah will review the schema tomorrow."
}

Example response shape:

{
  "tasks": [
    {
      "title": "Finalize API docs",
      "assignee": "John",
      "priority": "high",
      "deadline": null
    }
  ]
}

## Repository Structure

MeetFlow/
- backend/
  - src/
    - controllers/
    - middleware/
    - routes/
    - services/
    - utils/
  - index.js
  - package.json
- frontend/
  - app/
  - components/
  - lib/
  - package.json
  - vercel.json
- render.yaml
- DEPLOYMENT_GUIDE.md
- readme.md

## Configuration Notes

- In production, NEXT_PUBLIC_API_URL must point to your Render backend URL.
- In production, FRONTEND_URL must match your deployed Vercel domain.
- Never commit real secrets.
- Rotate keys immediately if any key was exposed.
