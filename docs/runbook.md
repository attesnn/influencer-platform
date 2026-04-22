# Runbook

## Local Setup
1. Copy `.env.example` to `.env.local`.
2. Fill Clerk and YouTube credentials.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev --name init`.
6. Run `npm run dev`.

## Operations
- Refresh influencer metrics manually: `POST /api/youtube/ingest`.
- Scheduled metrics refresh entrypoint: `POST /api/jobs/refresh-metrics` with `x-job-secret`.

## Troubleshooting
- OAuth callback errors: verify `YOUTUBE_REDIRECT_URI`.
- Prisma errors: verify `DATABASE_URL` and migrations.
- Unauthorized API calls: verify Clerk session and middleware matcher.
