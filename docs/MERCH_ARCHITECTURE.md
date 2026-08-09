# MERCH_ARCHITECTURE.md

## Overview
This document outlines the architecture for the Hysco Merchandise Platform, designed to integrate natively into `dreamofdreams.com`.

## Phase 1 (Frontend Foundation)
- Frontend: Responsive static page at `/merch.html`.
- Data: Mocked fixture data (`/data/merch-designs.json`).
- Persistence: `localStorage` (Namespace: `dreamofdreams.merch.savedDesigns`).

## Future Production Architecture
The system will transition to a serverless backend architecture to ensure security and scalability.

```
GitHub Pages frontend
        ↓
Serverless API (e.g., Cloud Functions/FastAPI)
        ↓
┌──────────────┬──────────────┬──────────────┐
│ AI Generator │   Database   │ File Storage │
└──────────────┴──────────────┴──────────────┘
        ↓
Printful API (Catalog, Mockups, Fulfillment)
        ↓
Stripe Checkout
        ↓
Webhook Verification (Server-side idempotency check)
```

## Security Model
- **No secrets in frontend:** API tokens/secrets (Stripe, Printful, AI) remain strictly server-side.
- **Payment Verification:** Stripe payment success must be verified via secure webhook before triggering Printful orders.
- **AI Security:** No arbitrary user prompts are passed to AI; users select structured preferences.

## Data Schema
- `conceptImageUrl`: The AI fashion concept/mockup.
- `productionArtworkUrl`: High-resolution transparent artwork (null if not produced).

## Workflow
- Candidates → Approved → Production.
