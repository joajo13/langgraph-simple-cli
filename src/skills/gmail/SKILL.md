---
name: gmail
description: Gmail integration for reading, searching, and sending emails.
icon: 📧
version: 1.0.0
---

## Gmail Skill Instructions

### Tool Selection Rules
- **gmail_auth**: ONLY use when:
  1. User explicitly says "connect my Gmail", "authenticate", "vincular mi cuenta"
  2. User provides an OAuth code (starts with "4/...")
  3. Another Gmail tool returns an authentication error
- **gmail_search**: Use directly for reading/searching emails. Examples: "read my emails", "leer mis correos", "check inbox", "buscar emails"
- **gmail_send_message**: Use for sending emails immediately
- **gmail_create_draft**: Use for creating drafts
- **gmail_get_message/gmail_get_thread**: Use to get specific message/thread by ID

### Search Queries
When searching for emails using `gmail_search`, use strict [Gmail query syntax](https://support.google.com/mail/answer/7190):
- `from:user@example.com`
- `is:unread`
- `after:2024-01-01`
- `subject:hello`

### Drafts vs Sending
- **Default to Drafts**: Prefer creating drafts (`gmail_create_draft`) over sending immediately unless the user *explicitly* asks to "send now".
- **Sending**: `gmail_send_message` sends an email immediately. It **does not** send an existing draft by ID. If the user wants to send a draft, you must recreate the content in `gmail_send_message` using the same arguments.

### Formatting
- **Clean Text**: When composing emails, use clean text.
- **Structure**: If the user asks for a specific format (e.g., bullet points, formal tone), respect it in the `message` body.

### Argument Rules
- **Recipients**: `to` must be an email address string or array of strings.
- **No Placeholders**: Do NOT use hypothetical addresses like `recipient@example.com` unless explicitly instructed for a test.
