# Architecture

## Stack
- Next.js App Router + TypeScript
- Prisma ORM + PostgreSQL
- Clerk authentication
- YouTube Data API integration

## Main Flows
1. User signs in via Clerk.
2. User role is set (`influencer` or `agency`) and stored in DB.
3. Influencer connects YouTube via OAuth callback flow.
4. Metrics snapshots are ingested and stored.
5. Agency creates campaign, system computes match score.
6. Agency sends offer; influencer accepts/rejects.

## Deployment
- App: Vercel
- DB: Neon/Supabase Postgres
- Scheduled jobs: Trigger.dev or hosted cron -> `/api/jobs/refresh-metrics`
