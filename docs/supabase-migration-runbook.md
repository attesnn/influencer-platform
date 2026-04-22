# Clerk to Supabase Runbook (EU Residency)

This runbook covers the infrastructure steps that cannot be automated fully inside the app repository.

## 1) Provision Supabase in EU

1. Create a Supabase project in an EU region (for example Frankfurt).
2. In Supabase Auth settings:
   - Enable Email/Password provider.
   - Set `Site URL` to your app domain.
   - Add redirect URLs:
     - `http://localhost:3000/dashboard`
     - `https://<your-domain>/dashboard`
3. Add environment variables to local and deployment platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (Supabase Postgres connection string)

## 2) Move DB to Supabase Postgres

1. Apply Prisma migrations against Supabase:
   - `npm run prisma:migrate`
2. Export and import data from old DB into Supabase:
   - `pg_dump --data-only --inserts "$OLD_DATABASE_URL" > data.sql`
   - `psql "$DATABASE_URL" -f data.sql`
3. Validate:
   - Read/write works in staging.
   - Dashboard, influencer, and agency views load for existing users.

## 3) Migrate users from Clerk to Supabase Auth

1. Export users from Clerk with at least:
   - `email`
   - original `clerk_user_id` (for audit reference)
2. Create users in Supabase Auth (dashboard import or admin workflow).
3. Build a mapping CSV:
   - header: `email,supabase_user_id`
4. Backfill local app users:
   - `npm run auth:backfill -- ./path/to/mapping.csv`

## 4) Cutover checklist

1. Rotate old Clerk secrets.
2. Remove Clerk env vars from deployment.
3. Verify user login, sign-up, sign-out, and YouTube connect callback.
4. After a stability window, remove `clerkUserId` from schema and old data migration scripts.
