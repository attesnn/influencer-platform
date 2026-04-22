# Data Model

Defined in `prisma/schema.prisma`.

## Core Tables
- `User`: app-level user profile linked to Clerk.
- `SocialAccount`: linked platform accounts (YouTube in v1).
- `InfluencerMetric`: time-series snapshots for key metrics.
- `Campaign`: agency-created campaign.
- `CampaignCriteria`: matching criteria for campaign.
- `CampaignMatch`: influencer value/fit score by campaign.
- `Offer`: offer requests from agency to influencer.
- `AuditEvent`: activity log for compliance and traceability.
