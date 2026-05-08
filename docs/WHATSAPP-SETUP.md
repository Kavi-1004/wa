# WhatsApp Module — Setup & Deployment Guide

Step-by-step guide to configure, run, and deploy the WhatsApp messaging module.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [WhatsApp Business Account Setup](#whatsapp-business-account-setup)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verifying the Setup](#verifying-the-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)
- A Meta (Facebook) Developer account
- A WhatsApp Business Account with API access

---

## WhatsApp Business Account Setup

### 1. Create a Meta App

1. Visit [Meta for Developers](https://developers.facebook.com/) and log in
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in the app name and contact email, then click **Create App**

### 2. Add WhatsApp to Your App

1. In the app dashboard, find **WhatsApp** and click **Set Up**
2. Select or create a **WhatsApp Business Account**
3. You'll be taken to the **API Setup** page

### 3. Get Your Credentials

From the **API Setup** page, copy:

| Credential | Where to Find | Env Variable |
|------------|---------------|--------------|
| **Access Token** | "Temporary access token" section (or generate a permanent System User token) | `WHATSAPP_API_TOKEN` |
| **Phone Number ID** | Shown below "From" phone number dropdown | `WHATSAPP_PHONE_NUMBER_ID` |
| **Business Account ID** | Shown at the top of the API Setup page | `WHATSAPP_BUSINESS_ID` |

> **Important:** Temporary tokens expire after 24 hours. For production, create a **System User** in Meta Business Suite → Settings → Business Settings → System Users, and generate a permanent token.

### 4. Create a Message Template

1. Go to **WhatsApp** → **Message Templates** in the Meta Business Suite
2. Click **Create Template**
3. Choose a category (e.g., **Utility** or **Marketing**)
4. Set the template name (e.g., `hello_world`) — this is what you'll put in `WHATSAPP_TEMPLATE_NAME`
5. Add template content and submit for approval
6. Wait for Meta to approve the template (usually takes a few minutes to hours)

> **Note:** Meta provides a pre-approved `hello_world` template for testing. You can use this immediately without creating your own.

### 5. Add Test Phone Numbers

1. In **API Setup**, under "To" phone number, click **Manage phone number list**
2. Add up to 5 phone numbers for testing (with country code)
3. Each number will receive a verification code via WhatsApp

---

## Local Development

### 1. Clone and Install

```bash
git clone <repo-url>
cd wa
npm install
```

### 2. Start Development Databases

```bash
npm run docker:dev
```

This starts PostgreSQL (port 5433) and Redis (port 6379) via Docker Compose.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your WhatsApp credentials:

```env
# Database (matches docker-compose.dev.yml)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/wa_dev

# WhatsApp API
WHATSAPP_API_TOKEN=your-actual-token-here
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_API_URL=https://graph.facebook.com/v25.0
WHATSAPP_TEMPLATE_NAME=hello_world
```

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Seed with default users
npx prisma db seed
```

### 5. Start the Dev Server

```bash
npm run start:dev
```

The server starts at `http://localhost:3000`. Swagger docs are at `http://localhost:3000/docs`.

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `WHATSAPP_API_TOKEN` | WhatsApp Cloud API bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Meta Business Suite |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `WHATSAPP_BUSINESS_ID` | `""` | WhatsApp Business Account ID |
| `WHATSAPP_API_URL` | `https://graph.facebook.com/v25.0` | WhatsApp API base URL |
| `WHATSAPP_TEMPLATE_NAME` | `""` | Default template name; if empty, messages are sent as plain text |

---

## Database Setup

The WhatsApp module adds two tables to your PostgreSQL database:

### WhatsApp Contacts (`whatsapp_contacts`)

Stores contact information with soft-delete support.

```sql
-- Automatically created by Prisma
CREATE TABLE whatsapp_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR UNIQUE NOT NULL,
  name        VARCHAR,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP
);
```

### WhatsApp Message Logs (`whatsapp_message_logs`)

Records every message send attempt with status and error details.

```sql
CREATE TABLE whatsapp_message_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id    UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  phone_number  VARCHAR NOT NULL,
  message       TEXT NOT NULL,
  wa_message_id VARCHAR,
  status        VARCHAR DEFAULT 'pending',
  error_detail  TEXT,
  sent_at       TIMESTAMP,
  created_at    TIMESTAMP DEFAULT now()
);
```

### Running Migrations

```bash
# Development — push schema directly
npm run prisma:push

# Production — create and apply migrations
npx prisma migrate dev --name add-whatsapp-module
npx prisma migrate deploy
```

---

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

### Docker (Full Stack)

```bash
# Build and run with Docker Compose
npm run docker:up
```

---

## Verifying the Setup

After starting the server, run these commands to verify everything works:

### 1. Register and Login

```bash
# Register a user
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"SecureP@ss123","firstName":"Admin","lastName":"User"}'

# Login to get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"SecureP@ss123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token: $TOKEN"
```

### 2. Store a Contact

```bash
curl -s -X POST http://localhost:3000/api/v1/whatsapp/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "contacts": [
      {"phoneNumber": "919876543210", "name": "Test Contact"}
    ]
  }' | python3 -m json.tool
```

### 3. Send a Test Message

```bash
# Get the contact ID from step 2
CONTACT_ID="<uuid-from-step-2>"

curl -s -X POST "http://localhost:3000/api/v1/whatsapp/send/$CONTACT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello from the API!"}' | python3 -m json.tool
```

### 4. Check Message Logs

```bash
curl -s http://localhost:3000/api/v1/whatsapp/logs \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 5. Access the Dashboard

Promote the user to ADMIN first:

```bash
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role='ADMIN' WHERE email='admin@test.com';"
```

Re-login (the role is embedded in the JWT), then visit:

```
http://localhost:3000/api/v1/whatsapp/dashboard
```

> **Tip:** You can use tools like [ModHeader](https://modheader.com/) browser extension to add the `Authorization: Bearer <token>` header when accessing the dashboard in your browser.

---

## Production Deployment

### Checklist

- [ ] Replace the temporary WhatsApp API token with a permanent **System User Token**
- [ ] Ensure `WHATSAPP_TEMPLATE_NAME` points to an **approved** template
- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure `DATABASE_URL` for your production PostgreSQL instance
- [ ] Run `npx prisma migrate deploy` to apply migrations
- [ ] Set up HTTPS (required by WhatsApp for webhook callbacks)
- [ ] Configure rate limiting appropriately for message volume
- [ ] Set up monitoring for message delivery failures via the logs endpoint

### Docker Production Build

```bash
# Build production image
docker build -t wa-backend .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e WHATSAPP_API_TOKEN=... \
  -e WHATSAPP_PHONE_NUMBER_ID=... \
  -e WHATSAPP_TEMPLATE_NAME=hello_world \
  wa-backend
```

---

## Troubleshooting

### "WhatsApp is not configured" error

**Cause:** `WHATSAPP_API_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is missing from `.env`.

**Fix:** Add both values to your `.env` file and restart the server.

### Messages are "failed" with "Invalid OAuth access token"

**Cause:** The WhatsApp API token is expired or incorrect.

**Fix:**
- For testing: Generate a new temporary token from Meta Developer Console → WhatsApp → API Setup
- For production: Create a System User and generate a permanent token

### "No active contacts found"

**Cause:** Either no contacts have been stored or all contacts are deactivated.

**Fix:** Store contacts via `POST /api/v1/whatsapp/contacts` first.

### Template message rejected

**Cause:** The template name doesn't exist in your WhatsApp Business Account, or it hasn't been approved yet.

**Fix:**
1. Check the template name matches exactly (case-sensitive)
2. Verify the template is in "Approved" status in Meta Business Suite
3. Ensure the template language code matches (default is `en`)

### Dashboard returns 401 Unauthorized

**Cause:** Missing or expired JWT token.

**Fix:** The dashboard requires the `Authorization: Bearer <token>` header. Use a browser extension like ModHeader to add the header, or access the dashboard URL programmatically.

### Dashboard returns 403 Forbidden

**Cause:** The authenticated user doesn't have `ADMIN` or `SUPER_ADMIN` role.

**Fix:** Update the user's role:
```bash
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role='ADMIN' WHERE email='your@email.com';"
```
Then re-login to get a new JWT with the updated role.

### Phone number validation fails

**Cause:** Phone number must be 10–15 digits in international format without the `+` prefix.

**Fix:** Use format like `919876543210` (country code + number), not `+919876543210` or `09876543210`.
