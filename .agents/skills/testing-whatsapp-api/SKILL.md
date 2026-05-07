---
name: testing-whatsapp-api
description: Test the WhatsApp contacts and messaging API endpoints end-to-end. Use when verifying WhatsApp module changes.
---

# Testing WhatsApp API Endpoints

## Prerequisites

1. Docker running (PostgreSQL + Redis via `docker compose up -d`)
2. `.env` file with database config and WhatsApp env vars (can be dummy values for testing error handling)
3. Prisma schema pushed: `npx prisma db push`
4. Dev server running: `npm run start:dev`

## Devin Secrets Needed

- `WHATSAPP_API_TOKEN` — For real message delivery testing (optional; dummy value tests error handling)
- `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp Cloud API phone number ID
- `WHATSAPP_BUSINESS_ID` — WhatsApp Business Account ID

## Endpoints to Test

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/whatsapp/contacts` | Store phone numbers |
| GET | `/api/v1/whatsapp/contacts` | List active contacts |
| POST | `/api/v1/whatsapp/send` | Send message to all contacts |

All endpoints are `@Public()` (no auth required).

## Test Scenarios

### 1. Store Contacts (valid)
```bash
curl -s -X POST http://localhost:3000/api/v1/whatsapp/contacts \
  -H "Content-Type: application/json" \
  -d '{"contacts": [{"phoneNumber": "919876543210", "name": "Test User"}]}'
```
Expect: 201, `stored: 1`, contact returned with `id`, `phoneNumber`, `name`.

### 2. Validation — bad phone number
```bash
curl -s -X POST http://localhost:3000/api/v1/whatsapp/contacts \
  -H "Content-Type: application/json" \
  -d '{"contacts": [{"phoneNumber": "abc", "name": "Bad"}]}'
```
Expect: 400, validation error about phone number format (10-15 digits).

### 3. Upsert behavior
Store same phone number with different name → should update, not duplicate.
Verify with GET that `total` count stays the same.

### 4. Send message (with dummy credentials)
```bash
curl -s -X POST http://localhost:3000/api/v1/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from test!"}'
```
Expect: 200, `sent: 0, failed: N`, each result has `status: "failed"` with error detail. Server should NOT crash.

### 5. Validation — empty message
Expect: 400, `"message should not be empty"`.

### 6. No contacts error
Deactivate all contacts, then send → Expect: 400, `"No active contacts found"`.

### 7. DB verification
Query `WhatsAppMessageLog` table to confirm failed sends are logged with `status`, `errorDetail`, `phoneNumber`.

## Tips

- Phone numbers must be 10-15 digits, no `+` prefix (stripped automatically on store).
- The send endpoint processes contacts sequentially to avoid WhatsApp rate limits.
- Swagger docs at `/docs` under the "WhatsApp" tag — useful for visual testing.
- With dummy credentials, the WhatsApp API returns `"Invalid OAuth access token"` — this is expected and proves error handling works.
- The `logMessage` helper catches its own DB errors silently, so logging failures won't mask send results.
