# WhatsApp Module — Dashboard Guide

The WhatsApp Dashboard is a server-rendered admin panel for managing contacts and monitoring message delivery. It is accessible at:

```
GET /api/v1/whatsapp/dashboard
```

**Access:** Requires `ADMIN` or `SUPER_ADMIN` role with a valid JWT token.

---

## Table of Contents

- [Accessing the Dashboard](#accessing-the-dashboard)
- [Overview](#overview)
- [Message Logs Tab](#message-logs-tab)
- [Contacts Tab](#contacts-tab)
- [Managing Contacts](#managing-contacts)
- [Sending Messages](#sending-messages)
- [Tips & Notes](#tips--notes)

---

## Accessing the Dashboard

The dashboard requires JWT authentication. Since it is a server-rendered HTML page, you need to pass the `Authorization` header with your request.

### Option 1: Browser Extension (Recommended)

1. Install a header-injection extension such as [ModHeader](https://modheader.com/) for Chrome/Firefox
2. Add a request header:
   - **Name:** `Authorization`
   - **Value:** `Bearer <your-jwt-token>`
3. Navigate to `http://localhost:3000/api/v1/whatsapp/dashboard`

### Option 2: cURL / HTTP Client

```bash
curl -s http://localhost:3000/api/v1/whatsapp/dashboard \
  -H "Authorization: Bearer <your-jwt-token>" \
  -o dashboard.html

# Open in browser
open dashboard.html     # macOS
xdg-open dashboard.html # Linux
```

### Option 3: Programmatic Access

```javascript
const response = await fetch('/api/v1/whatsapp/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const html = await response.text();
```

### Getting a JWT Token

```bash
# Login
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"YourPassword"}' | python3 -m json.tool

# Copy the accessToken from the response
```

---

## Overview

The dashboard has two main sections:

1. **Stats Cards** — Always visible at the top, showing key metrics
2. **Tab Navigation** — Switch between **Message Logs** and **Contacts** views

### Stats Cards

| Card | Description |
|------|-------------|
| **Active Contacts** | Number of contacts with `isActive: true` |
| **Total Messages** | Total message send attempts recorded |
| **Sent** | Messages successfully delivered to WhatsApp |
| **Failed** | Messages that failed to send (API error, invalid token, etc.) |
| **Pending** | Messages queued but not yet processed |

---

## Message Logs Tab

The default view. Shows a chronological table of all message send attempts.

### Log Table Columns

| Column | Description |
|--------|-------------|
| **Phone Number** | Recipient's phone number |
| **Contact** | Contact's display name (if set) |
| **Message** | Message text or template reference |
| **Status** | `SENT` (green), `FAILED` (red), or `PENDING` (yellow) |
| **WA Message ID** | WhatsApp's message ID (shown on success, `—` on failure) |
| **Error** | Error detail from WhatsApp API (shown on failure) |
| **Timestamp** | When the message was sent |

### Filtering by Status

Use the filter buttons above the log table:

- **All** — Show all message logs
- **Sent** — Only successfully delivered messages
- **Failed** — Only failed delivery attempts
- **Pending** — Only pending messages

Clicking a filter button reloads the dashboard with `?tab=logs&status=<filter>`.

### Pagination

Logs are paginated (20 per page). The current page and total count are shown below the table. Navigate between pages using the page links.

---

## Contacts Tab

Click the **Contacts** tab to switch to the contact management view. This shows all contacts (both active and inactive) with management actions.

### Contact Table Columns

| Column | Description |
|--------|-------------|
| **Phone Number** | Contact's phone number in international format |
| **Name** | Display name |
| **Status** | `Active` (green badge) or `Inactive` (gray badge) |
| **Messages** | Number of messages sent to this contact |
| **Created** | When the contact was first stored |
| **Actions** | Management buttons (see below) |

---

## Managing Contacts

### Adding a Contact

1. In the **Contacts** tab, find the **Add Contact** form at the top
2. Enter the **Phone Number** (10–15 digits, international format without `+`)
3. Enter the **Name** (optional)
4. Click **Add Contact**

> **Example:** Phone `919876543210`, Name `John Doe`

### Editing a Contact

1. Click the **Edit** button next to the contact
2. A modal appears with the current phone number and name
3. Modify the fields as needed
4. Click **Save Changes**

### Deactivating a Contact

1. Click the **Deactivate** button (shown for active contacts)
2. The contact's status changes to **Inactive**
3. Deactivated contacts are excluded from bulk message sends
4. The contact row remains visible in the dashboard for reference

### Reactivating a Contact

1. Click the **Reactivate** button (shown for inactive contacts)
2. The contact's status changes back to **Active**
3. The contact will be included in future bulk message sends

---

## Sending Messages

### Send to Individual Contact

1. Click the **Send Message** button next to the contact
2. A modal appears with a message input field
3. Enter your message text
4. Optionally enter a **Template Name** to use a WhatsApp template instead of plain text
5. Click **Send**

### Send to All Active Contacts

1. In the **Contacts** tab, click the **Send to All Active** button (top-right)
2. A prompt asks for the message text
3. The message is sent to every contact with `Active` status

> **Note:** Messages are sent sequentially (one at a time) to avoid WhatsApp API rate limits.

---

## Tips & Notes

### Template vs. Text Messages

- If a **template name** is provided (either in the send modal or via `WHATSAPP_TEMPLATE_NAME` env), the message is sent as a **template message**
- If no template is configured, the message is sent as **plain text**
- Template messages must be pre-approved by Meta — use the `hello_world` template for testing
- The `message` field is always stored in logs for reference, regardless of whether a template is used

### Understanding Message Statuses

| Status | Meaning |
|--------|---------|
| **Sent** | WhatsApp API accepted the message and returned a message ID |
| **Failed** | WhatsApp API returned an error (invalid token, wrong number format, template not found, etc.) |
| **Pending** | Message was created but hasn't been processed yet (uncommon in normal flow) |

### Common Failure Reasons

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid OAuth access token" | API token expired or incorrect | Generate a new token in Meta Developer Console |
| "Parameter value is not valid" | Phone number format issue | Ensure the number is in international format without `+` |
| "Template name does not exist" | Template not found or not approved | Check template name and approval status in Meta Business Suite |
| "Rate limit hit" | Too many API requests | Wait and retry; consider implementing queue-based sending |

### Refreshing the Dashboard

- Click the **Refresh** button in the top-right corner to reload the page with fresh data
- The dashboard fetches live data from the database on every page load

### API Documentation

- Click the **API Docs** button in the top-right corner to open the Swagger documentation at `/docs`
- All dashboard actions can also be performed via the REST API endpoints documented in [WHATSAPP.md](./WHATSAPP.md)
