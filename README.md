# Influencer Platform (V1 Foundation)

YouTube-first platform for influencer data ingestion, campaign matching, and agency offer requests.

## Tech Stack
- Next.js (App Router, TypeScript)
- Prisma + PostgreSQL
- Supabase Auth
- YouTube Data API
- Tailwind CSS

## Local Setup
1. Copy `.env.example` to `.env.local` and fill values.
2. Install dependencies:
   - `npm install`
3. Prepare database:
   - `npm run prisma:generate`
   - `npm run prisma:migrate -- --name init`
4. Start development server:
   - `npm run dev`

Open [http://localhost:3000](http://localhost:3000).

## Core Features Implemented
- Role onboarding (`influencer` / `agency`)
- YouTube OAuth connect + callback
- Baseline influencer metric ingestion
- Campaign creation and influencer match scoring
- Offer request send/respond flow
- GDPR-oriented export and delete-account endpoints

## Documentation
See `docs/`:
- `product-scope.md`
- `architecture.md`
- `data-model.md`
- `api-contracts.md`
- `security-gdpr.md`
- `runbook.md`
- `progress-log.md`
