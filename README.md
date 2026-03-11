# CognitiveOS

A personal cognitive management system that helps you capture thoughts, structure startup ideas, compress learning content, and manage weekly execution blocks using AI.

## Architecture
- **Frontend**: Next.js 14 (App router), Tailwind CSS, Shadcn UI, Zustand State Management
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **AI Engine**: Google Gemini API (`@google/genai`)

## Prerequisites
1. Node.js (v18+)
2. PostgreSQL running locally or remotely
3. Gemini API Key

## Setup Instructions

### 1. Database Setup
1. Create a PostgreSQL database called `cognitiveos`
2. Open `backend/.env` and configure your `DATABASE_URL` (see `backend/.env.example`)

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```
*(In production, use `npx prisma migrate deploy`)*

Start the backend API server:
```bash
npm run dev
```
It will run on `http://localhost:5000`.

### 3. Frontend Setup
Open `frontend/.env` and verify `NEXT_PUBLIC_API_URL` is pointing to `http://localhost:5000/api`.

```bash
cd frontend
npm install
npm run dev
```
It will run on `http://localhost:3000`.

## Production Deployment
- **Frontend**: Connect the `frontend` directory to Vercel. Next.js handles API routing via the configured `.env` variable `NEXT_PUBLIC_API_URL` pointing to your deployed backend.
- **Backend**: Deploy the `backend` folder to Render or Railway. Make sure to set `DATABASE_URL`, `GEMINI_API_KEY`, and `JWT_SECRET` in the environment variables. Use `npm start` (requires compiling via `npx tsc`).

## Features
- **Brain Dump**: AI structures messy text into a Startup Idea JSON
- **Idea Canvas**: Rich inline editing for AI-generated startup ideas
- **Learning Compressor**: AI generates kids/exam/bullets/step-by-step explanations
- **Focus Mode**: Weekly schedule execution with a timer, status logging, and HTML5 browser API notifications
