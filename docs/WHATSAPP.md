# WhatsApp Module — API Reference

The WhatsApp module provides contact management, message sending via the WhatsApp Cloud API, message logging, and an admin dashboard. All endpoints are prefixed with `/api/v1/whatsapp` and require JWT authentication (`Authorization: Bearer <token>`).

---

## Table of Contents

- [Configuration](#configuration)
- [Contact Endpoints](#contact-endpoints)
  - [Store Contacts (Bulk)](#store-contacts-bulk)
  - [List Contacts](#list-contacts)
  - [Get Contact by ID](#get-contact-by-id)
  - [Update Contact](#update-contact)
  - [Delete (Deactivate) Contact](#delete-deactivate-contact)
- [Messaging Endpoints](#messaging-endpoints)
  - [Send to All Active Contacts](#send-to-all-active-contacts)
  - [Send to Individual Contact](#send-to-individual-contact)
  - [Send to Selected Contacts (Bulk)](#send-to-selected-contacts-bulk)
- [Message Logs](#message-logs)
- [Dashboard](#dashboard)
  - [Login / Logout](#login--logout)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)

---

## Configuration

Add these variables to your `.env` file:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `WHATSAPP_API_TOKEN` | Yes | WhatsApp Cloud API access token from Meta Business Suite | — |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Phone number ID from WhatsApp Business Account | — |
| `WHATSAPP_BUSINESS_ID` | No | WhatsApp Business Account ID | — |
| `WHATSAPP_API_URL` | No | WhatsApp Cloud API base URL | `https://graph.facebook.com/v25.0` |
| `WHATSAPP_TEMPLATE_NAME` | No | Default message template name from your WhatsApp account | `""` (falls back to text message) |

### Obtaining WhatsApp Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or open your app → **WhatsApp** → **API Setup**
3. Copy the **Temporary access token** (for testing) or generate a permanent **System User Token**
4. Copy the **Phone number ID** shown in the API Setup page
5. Create a message template under **WhatsApp** → **Message Templates** (e.g. `hello_world`)

---

## Contact Endpoints

### Store Contacts (Bulk)

Import one or more contacts. Existing phone numbers are upserted (updated and reactivated).

```
POST /api/v1/whatsapp/contacts
```

**Request Body:**

```json
{
  "contacts": [
    { "phoneNumber": "919876543210", "name": "Alice" },
    { "phoneNumber": "918765432109", "name": "Bob" },
    { "phoneNumber": "917654321098" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contacts` | array | Yes | Array of contact objects |
| `contacts[].phoneNumber` | string | Yes | 10–15 digit international format, no `+` prefix |
| `contacts[].name` | string | No | Display name |

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "stored": 3,
    "contacts": [
      { "id": "uuid", "phoneNumber": "919876543210", "name": "Alice" },
      { "id": "uuid", "phoneNumber": "918765432109", "name": "Bob" },
      { "id": "uuid", "phoneNumber": "917654321098", "name": null }
    ]
  }
}
```

---

### List Contacts

Retrieve all **active** contacts with pagination.

```
GET /api/v1/whatsapp/contacts?page=1&limit=20
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 25,
    "page": 1,
    "totalPages": 2,
    "contacts": [
      {
        "id": "uuid",
        "phoneNumber": "919876543210",
        "name": "Alice",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

> **Note:** Only active contacts (`isActive: true`) are returned. Deactivated contacts are excluded.

---

### Get Contact by ID

```
GET /api/v1/whatsapp/contacts/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phoneNumber": "919876543210",
    "name": "Alice",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Contact with id \"uuid\" not found"
}
```

---

### Update Contact

Update any combination of phone number, name, or active status.

```
PATCH /api/v1/whatsapp/contacts/:id
```

**Request Body (all fields optional):**

```json
{
  "phoneNumber": "919999999999",
  "name": "Alice Smith",
  "isActive": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | string | New phone number (10–15 digits, no `+`) |
| `name` | string | Updated display name |
| `isActive` | boolean | Reactivate (`true`) or deactivate (`false`) |

**Response (200):** Returns the updated contact object.

---

### Delete (Deactivate) Contact

Soft-deletes a contact by setting `isActive` to `false`. The contact remains in the database for historical reference in message logs.

```
DELETE /api/v1/whatsapp/contacts/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Contact deactivated successfully"
  }
}
```

> To reactivate a contact, use `PATCH /contacts/:id` with `{ "isActive": true }`.

---

## Messaging Endpoints

All messaging endpoints accept an optional `templateName`. The resolution order is:

1. `templateName` from the request body (per-request override)
2. `WHATSAPP_TEMPLATE_NAME` from environment config (default)
3. If neither is set, the message is sent as a **plain text** message

When a template is used, the `message` field is stored in logs for reference but the actual WhatsApp message uses the template.

### Send to All Active Contacts

```
POST /api/v1/whatsapp/send
```

**Request Body:**

```json
{
  "message": "Hello everyone!",
  "templateName": "hello_world"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message text (or log reference when using template) |
| `templateName` | string | No | WhatsApp template name override |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sent": 2,
    "failed": 0,
    "total": 2,
    "results": [
      {
        "phoneNumber": "919876543210",
        "name": "Alice",
        "status": "sent",
        "waMessageId": "wamid.xxx"
      },
      {
        "phoneNumber": "918765432109",
        "name": "Bob",
        "status": "sent",
        "waMessageId": "wamid.yyy"
      }
    ]
  }
}
```

---

### Send to Individual Contact

```
POST /api/v1/whatsapp/send/:contactId
```

**Request Body:**

```json
{
  "message": "Hi Alice!",
  "templateName": "hello_world"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 1,
    "sent": 1,
    "failed": 0,
    "results": [
      {
        "phoneNumber": "919876543210",
        "name": "Alice",
        "status": "sent",
        "waMessageId": "wamid.xxx"
      }
    ]
  }
}
```

**Error — inactive contact (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Contact \"919876543210\" is not active"
}
```

---

### Send to Selected Contacts (Bulk)

Send to a specific set of contacts by their IDs.

```
POST /api/v1/whatsapp/send-bulk
```

**Request Body:**

```json
{
  "message": "Bulk announcement",
  "templateName": "hello_world",
  "contactIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message text |
| `templateName` | string | No | Template name override |
| `contactIds` | string[] | Yes | Array of contact UUIDs to message |

> Only **active** contacts from the provided IDs are messaged. Returns 400 if none are active.

**Response (200):** Same structure as "Send to All" — returns `sent`, `failed`, `total`, and `results`.

---

## Message Logs

Retrieve message delivery history with optional status filtering and pagination.

```
GET /api/v1/whatsapp/logs?status=failed&page=1&limit=20
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by: `sent`, `failed`, or `pending` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "contactId": "uuid",
        "phoneNumber": "919876543210",
        "message": "Hello!",
        "status": "sent",
        "waMessageId": "wamid.xxx",
        "errorDetail": null,
        "sentAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "contactName": "Alice"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

---

## Dashboard

The admin dashboard is a server-rendered HTML page accessible at:

```
GET /api/v1/whatsapp/dashboard
```

**Access:** The dashboard has its own login page — no manual JWT header setup is needed. Just navigate to the URL and sign in with your email and password.

### Login / Logout

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/whatsapp/dashboard/login` | Login page |
| POST | `/api/v1/whatsapp/dashboard/login` | Authenticate and redirect to dashboard |
| GET | `/api/v1/whatsapp/dashboard/logout` | Clear session and redirect to login |

Authentication is handled via an HTTP-only cookie (`wa_dashboard_token`). After logging in, all dashboard actions (add/edit/delete contacts, send messages) work automatically without any browser extension.

### Features

**Message Logs Tab** (`?tab=logs`):
- Summary stats cards: Active Contacts, Total Messages, Sent, Failed, Pending
- Message log table with phone number, contact name, message, status, WhatsApp message ID, error details, and timestamp
- Status filter buttons (All / Sent / Failed / Pending)
- Pagination

**Contacts Tab** (`?tab=contacts`):
- Add Contact form (phone number + name)
- Contact table with status badges, message counts, and action buttons
- Per-contact actions: Edit, Deactivate/Reactivate, Send Message
- "Send to All Active" bulk action button
- Edit and Send Message modals

### Query Parameters

| Param | Description |
|-------|-------------|
| `tab` | Active tab: `logs` (default) or `contacts` |
| `status` | Log status filter (logs tab only) |
| `page` | Page number (logs tab only) |

---

## Database Schema

### WhatsAppContact

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `phone_number` | String | Unique, international format |
| `name` | String? | Optional display name |
| `is_active` | Boolean | Soft-delete flag (default `true`) |
| `created_at` | DateTime | Record creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

### WhatsAppMessageLog

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `contact_id` | UUID | Foreign key → WhatsAppContact |
| `phone_number` | String | Denormalized phone number |
| `message` | String | Message text or template reference |
| `wa_message_id` | String? | WhatsApp message ID (on success) |
| `status` | String | `sent`, `failed`, or `pending` |
| `error_detail` | String? | Error message (on failure) |
| `sent_at` | DateTime? | Delivery timestamp |
| `created_at` | DateTime | Record creation timestamp |

---

## Error Handling

| Status | Scenario |
|--------|----------|
| `400` | Validation error, no active contacts, WhatsApp not configured, inactive contact |
| `401` | Missing or invalid JWT token |
| `403` | Insufficient role (dashboard requires ADMIN) |
| `404` | Contact not found |
| `500` | Unexpected server error |

All errors follow the framework's standard error response format with `success: false`, `statusCode`, `message`, and optional `details`.
