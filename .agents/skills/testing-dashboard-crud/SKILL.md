---
name: testing-dashboard-crud
description: Test WhatsApp dashboard CRUD operations (contacts and users). Use when verifying dashboard UI changes, API endpoint changes, or Helmet/CSP configuration.
---

# Testing WhatsApp Dashboard CRUD

## Prerequisites

1. Docker running (for PostgreSQL and Redis)
2. Node.js dependencies installed

## Environment Setup

```bash
# Start dev databases
npm run docker:dev

# IMPORTANT: The docker-compose uses password "password" for PostgreSQL,
# but .env.example has "postgres". Fix DATABASE_URL in .env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/enterprise_db

# Push schema and seed
npm run prisma:push
npx prisma db seed

# Start dev server
npm run start:dev
```

## Devin Secrets Needed

None — uses seeded local credentials only.

## Test Credentials

- **Admin:** admin@enterprise.com / Admin@123456 (SUPER_ADMIN role)
- **User:** user@enterprise.com / Admin@123456 (USER role)

## Dashboard URL

`http://localhost:3000/api/v1/whatsapp/dashboard/login`

## Known Gotchas

- **Helmet CSP**: The dashboard uses inline `<script>` tags and inline event handlers (`onclick`, `onsubmit`). Helmet's defaults block both via `script-src 'self'` and `script-src-attr 'none'`. Both must be configured to allow `'unsafe-inline'` in `src/main.ts`.
- **`.env.example` MAIL_FROM**: The value might have misplaced quotes (e.g., `"Enterprise App" <noreply@...>` instead of `"Enterprise App <noreply@...>"`). This breaks docker-compose env parsing.
- **Response interceptor**: All API responses are wrapped in `{ success, statusCode, message, data }`. The dashboard JS must check `res.ok` or throw on non-2xx status codes — checking `r.success === false` alone is insufficient because the response interceptor only wraps successful responses.

## Test Cases

### Contacts (via Contacts tab)
1. **Create**: Fill phone + name → click Add Contact → verify contact appears in list
2. **Edit**: Click Edit → change name → Save → verify name updated in list
3. **Deactivate**: Click Deactivate → verify status changes to Inactive
4. **Reactivate**: Click Reactivate → verify status returns to Active

### Users (via Users tab)
1. **Create**: Fill email/name/password/role → Create User → verify user appears in list
2. **Edit**: Click Edit → change first name → Save → verify updated in list
3. **Delete**: Click Delete → confirm → verify user removed from list

### Error Handling
1. **Duplicate user**: Try creating user with existing email → verify red error message appears (not false success)

## API Endpoints (for backend-only testing)

```bash
# Login
curl -s http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@enterprise.com","password":"Admin@123456"}'

# Contacts CRUD
POST   /api/v1/whatsapp/contacts      # {contacts: [{phoneNumber, name}]}
GET    /api/v1/whatsapp/contacts
PATCH  /api/v1/whatsapp/contacts/:id   # {phoneNumber, name}
DELETE /api/v1/whatsapp/contacts/:id

# Users CRUD
POST   /api/v1/users                   # {email, firstName, lastName, password, role}
GET    /api/v1/users
PATCH  /api/v1/users/:id               # {firstName, lastName, role, isActive}
DELETE /api/v1/users/:id
```
