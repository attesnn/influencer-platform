# Data Model

Defined in `prisma/schema.prisma`.

## Core Tables
- `User`: app-level identity linked to Clerk (default role currently influencer-first flow).
- `SocialAccount`: linked platform identities per user; supports multi-account unification across providers.
- `InfluencerMetric`: time-series snapshots for key metrics.
- `Campaign`: agency-created campaign.
- `CampaignCriteria`: matching criteria for campaign.
- `CampaignMatch`: influencer value/fit score by campaign.
- `Offer`: offer requests from agency to influencer.
- `AuditEvent`: activity log for compliance and traceability.

## Platform Linking Status
- Active: YouTube OAuth connection and metric ingestion are implemented.
- Planned: Meta and TikTok linkage are represented in onboarding UX and expected `SocialAccount` expansion, but functional OAuth integration is not yet enabled.

## Future Migration Notes
- `SocialAccount` should keep one row per `(userId, platform, platformAccountId)` to support users linking multiple handles where providers allow it.
- Add a unique constraint for provider identity lookups (for example, `(platform, platformAccountId)`) to prevent duplicate account ownership across users.
- Keep OAuth token fields provider-agnostic (`accessToken`, `refreshToken`, `expiresAt`, `scope`) so new integrations do not require schema redesign.
- Add provider metadata JSON (for example, username/handle, avatar URL, account type) to avoid frequent migrations for non-critical profile fields.
- Plan index coverage for common queries: by `userId`, by `(platform, oauthStatus)`, and by `(platform, platformAccountId)` for callback/link resolution.
