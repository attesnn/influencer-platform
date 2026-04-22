# Progress Log

## 2026-04-01
- Bootstrapped app foundation with Next.js, Prisma, Clerk, and PostgreSQL schema.
- Added role onboarding and protected workspace routes for influencers and agencies.
- Added YouTube OAuth connect/callback and baseline metrics ingestion endpoint.
- Added campaign creation, scoring, matching, and offer APIs/pages.
- Added security/GDPR baseline endpoints and project documentation set.

## 2026-04-22
- Refreshed landing page to social-first login UI (Google/YouTube, Meta, TikTok) with email as secondary.
- Added provider icons and converted login options into reusable `SocialLoginPreview` component.
- Reworked post-login dashboard into influencer-first onboarding with account-linking progress and next steps.
- Removed legacy role selection flow (`RoleSetup`, `/api/user/role`, and `roleSchema`) from active app paths.
