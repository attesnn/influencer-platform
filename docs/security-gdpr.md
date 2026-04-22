# Security and GDPR Baseline

## Implemented
- OAuth tokens are encrypted at rest before database storage.
- Role-based route and API protection via Clerk + middleware.
- Input validation with Zod for write endpoints.
- User data export endpoint and delete-account endpoint.

## Required Before Production
- Privacy policy and DPA text.
- Cookie consent and explicit YouTube data consent logging.
- Data retention schedule and automated deletion.
- Incident response runbook and access-control policy.
