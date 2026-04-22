# API Contracts (V1)

## YouTube
- `GET /api/youtube/connect`
  - Starts OAuth flow.
- `GET /api/youtube/callback`
  - OAuth callback and account linking.
- `POST /api/youtube/ingest`
  - Pull latest YouTube metrics snapshot.

## Campaigns and Matching
- `GET /api/campaigns`
- `POST /api/campaigns`
  - Body includes campaign details and min thresholds.
- `GET /api/matches?campaignId=<id>`

## Offers
- `GET /api/offers`
- `POST /api/offers`
- `PATCH /api/offers`
  - Body: `{ offerId, status: "accepted" | "rejected" }`

## Privacy
- `GET /api/privacy/export`
- `DELETE /api/privacy/delete-account`
