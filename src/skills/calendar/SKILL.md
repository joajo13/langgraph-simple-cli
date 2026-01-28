---
name: calendar
description: Manage Google Calendar events (list, create, update).
icon: 📅
version: 1.0.0
---
This skill allows you to interact with the user's Google Calendar.
You can:
- List upcoming events using `calendar_get_events`.
- Create new events using `calendar_create_event`.
- Check availability.

Usage Tips:
- Always check the current time using the `datetime` skill before querying or creating events to ensure you use the correct date context.
- When creating events, confirm the start and end time with the user if valid times aren't provided.
- If an API error occurs regarding "insufficient permissions", ask the user to re-authenticate using `/auth`.
