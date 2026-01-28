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

> [!IMPORTANT]
> **MANDATORY STEP:** You **MUST** call the `get_datetime` tool before creating any event.
> **DO NOT** rely on your internal knowledge or the system prompt for the date.
> **DO NOT** hallucinate the year (e.g. 2023).
> 
> IF YOU DO NOT CALL `get_datetime`, YOU WILL FAIL.
> 
> **Rule:**
> 1. User asks to create event.
> 2. YOU CALL `get_datetime`.
> 3. YOU CALCULATE the date.
> 4. YOU CALL `calendar_create_event`.
>
> **CRITICAL:**
> - If the calculated time is in the past, **CREATE THE EVENT ANYWAY**. Do not argue with the user.
> - If no timezone is specified, default to the one returned by `get_datetime`.

### IMPORTANT: Handling Dates and Times
The `calendar_create_event` tool requires EXACT ISO 8601 formatted date strings (e.g., `2023-10-27T10:00:00-03:00`).
The user will often speak in relative terms like "tomorrow at 10am" or "on Friday".
**You CANNOT pass "tomorrow" or "Friday" to the tool.**

#### Workflow for Creating Events:
1. **Get Current Time**: ALWAYS call `get_datetime` first to establish the "now".
2. **Calculate ISO Strings**: accurately calculate the `startTime` and `endTime` based on the current time and the user's request.
   - If no duration is specified, assume 1 hour.
   - Respect the timezone returned by `get_datetime`.
3. **Call Tool**: Call `calendar_create_event` with the calculated ISO strings.

### CRITICAL: Argument Structure
The `calendar_create_event` tool accepts **FLAT** arguments.
**DO NOT** use nested JSON objects like `{'event': {'summary': ...}}`.

**CORRECT Usage:**
`calendar_create_event(summary="Title", startTime="...", endTime="...")`

**WRONG Usage:**
`calendar_create_event(event={summary: "Title", start: ...})`   <-- **NEVER DO THIS**

#### Example:
User: "Meeting with Juan tomorrow at 10am"
1. `get_datetime` -> Returns "2026-01-28 15:30:00 (America/Argentina/Buenos_Aires)"
2. reasoning: "Tomorrow" is 2026-01-29. 10am is 10:00:00. Timezone is -03:00.
   - Start: `2026-01-29T10:00:00-03:00`
   - End: `2026-01-29T11:00:00-03:00` (assuming 1h)
3. `calendar_create_event(summary="Meeting with Juan", startTime="2026-01-29T10:00:00-03:00", endTime="2026-01-29T11:00:00-03:00")`

### Deleting Events
- **Primary Tool**: `calendar_delete_event`
- **Requirement**: You MUST have the `eventId`.
- **Warning**: DO NOT use `calendar_update_event` to "mark" an event as deleted (e.g. by changing the title to "Cancelled"). You MUST use `calendar_delete_event` to actually remove it.
- **Workflow**:
    1. `calendar_get_events` (to find the ID)
    2. `calendar_delete_event(eventId="...")`

### Updating Events
- **Primary Tool**: `calendar_update_event`
- **Requirement**: You MUST have the `eventId`.
- **Workflow**:
    1. `calendar_get_events` (to find the ID)
    2. `calendar_update_event(eventId="...", ...)`
- **Note**: Only provide the fields you want to change.

### Troubleshooting
- If you get "Insufficient permissions", ask the user to re-authenticate with `/auth`.
- If you are unsure about the year, check `get_datetime`.
