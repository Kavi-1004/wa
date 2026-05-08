---
name: testing-whatsapp-module
description: How to set up and test the WhatsApp module locally (contacts CRUD, messaging, logs, dashboard).
---

## Local Environment Setup

1. Start Docker services (postgres + redis):
   ```bash
   npm run docker:dev
   ```
2. Copy `.env.example` to `.env` and fill in values. Key vars:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/wa_dev`
   - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` (use real or dummy values)
   - `WHATSAPP_TEMPLATE_NAME` (default: `hello_world`)
3. Push Prisma schema:
   ```bash
   npx prisma db push
   ```
4. Start dev server:
   ```bash
   npm run start:dev
   ```

## Getting an Admin JWT Token

```bash
# Register
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"SecureP@ss123","name":"Admin"}'

# Login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"SecureP@ss123"}'
# Extract accessToken from response

# Promote to ADMIN for dashboard access
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@test.com';"
# Re-login after role change to get updated token
```

## API Endpoints (all require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/whatsapp/contacts | Bulk store contacts |
| GET | /api/v1/whatsapp/contacts?page=1&limit=10 | List active contacts (paginated) |
| GET | /api/v1/whatsapp/contacts/:id | Get single contact |
| PATCH | /api/v1/whatsapp/contacts/:id | Update contact |
| DELETE | /api/v1/whatsapp/contacts/:id | Soft-delete (deactivate) contact |
| POST | /api/v1/whatsapp/send/:contactId | Send message to one contact |
| POST | /api/v1/whatsapp/send-bulk | Send to selected contactIds |
| GET | /api/v1/whatsapp/logs?page=1&limit=10&status=failed | Message logs (filterable) |
| GET | /api/v1/whatsapp/dashboard | Admin dashboard (ADMIN/SUPER_ADMIN only) |

## Testing Notes

- WhatsApp API calls will fail with dummy tokens - this is expected. Verify the flow works and message logs record failures.
- Contacts use soft-delete (`isActive` flag). Deleted contacts still exist in DB but are excluded from active list.
- Dashboard is server-rendered HTML. Client-side fetch calls (add/edit/delete/send) don't include the Authorization header, so they'll get 401 when triggered from the browser. The server-rendered views work correctly with the JWT passed via query or header.
- For dashboard UI testing, use Playwright headless with `extra_http_headers: {Authorization: Bearer <token>}` to bypass auth.
