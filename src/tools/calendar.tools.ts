import { DynamicStructuredTool, StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from 'googleapis';
import { AuthService } from "../services/auth.service";
import { logger } from "../logger";

export function createCalendarTools(authService: AuthService): StructuredTool[] {
    const tools: StructuredTool[] = [];

    // --- LIST EVENTS TOOL ---
    tools.push(
        new DynamicStructuredTool({
            name: "calendar_get_events",
            description: "List upcoming events from the primary calendar.",
            schema: z.object({
                maxResults: z.number().optional().default(10).describe("Maximum number of events to fetch"),
                timeMin: z.string().optional().describe("ISO date string start time. Defaults to now."),
                timeMax: z.string().optional().describe("ISO date string end time.")
            }),
            func: async ({ maxResults, timeMin, timeMax }) => {
                const client = authService.getAuthenticatedClient();
                if (!client) {
                    return "Error: You are not authenticated with Google. Please use the '/auth' command to log in first.";
                }
                const calendar = google.calendar({ version: 'v3', auth: client });

                try {
                    const res = await calendar.events.list({
                        calendarId: 'primary',
                        timeMin: timeMin || (new Date()).toISOString(),
                        timeMax: timeMax,
                        maxResults: maxResults,
                        singleEvents: true,
                        orderBy: 'startTime',
                    });
                    const events = res.data.items;
                    if (!events || events.length === 0) {
                        return 'No upcoming events found.';
                    }
                    return events.map((event: any) => {
                        const start = event.start.dateTime || event.start.date;
                        return `${start}: ${event.summary} (${event.id})`;
                    }).join('\n');
                } catch (error: any) {
                    logger.error("Error fetching calendar events", error);
                    if (error.code === 403 || error.code === 401 || (error.message && error.message.includes('insufficient'))) {
                        return "Error: Insufficient permissions. Please tell the user they need to re-authenticate.";
                    }
                    return `Error fetching events: ${error.message}`;
                }
            }
        })
    );

    // --- CREATE EVENT TOOL ---
    tools.push(
        new DynamicStructuredTool({
            name: "calendar_create_event",
            description: "Create a new event in the primary calendar. Use FLAT arguments only. DO NOT nest arguments in an 'event' object. You MUST convert relative times (e.g. 'tomorrow') to absolute ISO timestamps using the current time before calling this.",
            schema: z.preprocess((val: any) => {
                logger.info(`[Calendar Debug] Raw Tool Input: ${JSON.stringify(val)}`);
                if (!val || typeof val !== 'object') return val;

                const extractDate = (obj: any) => obj?.dateTime || obj?.date;

                if (val.event) {
                    return {
                        summary: val.event.summary,
                        description: val.event.description,
                        startTime: extractDate(val.event.start),
                        endTime: extractDate(val.event.end)
                    };
                }

                if (typeof val.start === 'string' && typeof val.end === 'string') {
                    return {
                        ...val,
                        startTime: val.start,
                        endTime: val.end
                    };
                }

                const startVal = extractDate(val.start);
                const endVal = extractDate(val.end);

                if (startVal || endVal) {
                    return {
                        ...val,
                        startTime: startVal,
                        endTime: endVal
                    };
                }

                return val;
            }, z.object({
                summary: z.string().describe("Title of the event"),
                description: z.string().optional().describe("Description of the event"),
                startTime: z.string().describe("Start time in ISO format (2026-01-28T10:00:00-03:00) or date (2026-01-28). MUST BE CALCULATED from relative times."),
                endTime: z.string().describe("End time in ISO format (2026-01-28T11:00:00-03:00) or date (2026-01-28). MUST BE CALCULATED from relative times.")
            })),
            func: async ({ summary, description, startTime, endTime }) => {
                const client = authService.getAuthenticatedClient();
                if (!client) {
                     return "Error: You are not authenticated with Google. Please use the '/auth' command to log in first.";
                }
                const calendar = google.calendar({ version: 'v3', auth: client });

                try {
                    const isDateOnly = (time: string) => /^\d{4}-\d{2}-\d{2}$/.test(time);
                    const ensureOffset = (time: string) => {
                        if (isDateOnly(time)) return time;
                        if (!time.match(/(Z|[+-]\d{2}(:?\d{2})?)$/)) {
                            return time + 'Z'; 
                        }
                        return time;
                    };

                    const finalStartup = ensureOffset(startTime);
                    const finalEndTime = ensureOffset(endTime);
                    
                    const event = {
                        summary,
                        description,
                        start: isDateOnly(finalStartup) ? { date: finalStartup } : { dateTime: finalStartup },
                        end: isDateOnly(finalEndTime) ? { date: finalEndTime } : { dateTime: finalEndTime },
                    };
                    const res = await calendar.events.insert({
                        calendarId: 'primary',
                        requestBody: event,
                    });
                    return `Event created: ${res.data.htmlLink}`;
                } catch (error: any) {
                    logger.error("Error creating calendar event", error);
                    if (error.response && error.response.data) {
                        logger.error(`Google API Error Details: ${JSON.stringify(error.response.data)}`);
                    }
                    if (error.code === 403 || error.code === 401 || (error.message && error.message.includes('insufficient'))) {
                             return "Error: Insufficient permissions to create events. Please tell the user to re-authenticate using '/auth'.";
                        }
                    return `Error creating event: ${error.message}`;
                }
            }
        })
    );
    
    // --- DELETE EVENT TOOL ---
    tools.push(
        new DynamicStructuredTool({
            name: "calendar_delete_event",
            description: "Delete an event from the primary calendar by ID. You must get the ID from 'calendar_get_events' first.",
            schema: z.object({
                eventId: z.string().describe("The ID of the event to delete.")
            }),
            func: async ({ eventId }) => {
                const client = authService.getAuthenticatedClient();
                if (!client) return "Error: Not authenticated. Use '/auth'.";
                const calendar = google.calendar({ version: 'v3', auth: client });

                try {
                    await calendar.events.delete({
                        calendarId: 'primary',
                        eventId: eventId,
                    });
                    return `Event with ID ${eventId} deleted successfully.`;
                } catch (error: any) {
                    logger.error("Error deleting calendar event", error);
                    if (error.code === 403 || error.code === 401 || (error.message && error.message.includes('insufficient'))) {
                            return "Error: Insufficient permissions. Please tell the user to re-authenticate.";
                        }
                    return `Error deleting event: ${error.message}`;
                }
            }
        })
    );

    // --- UPDATE EVENT TOOL ---
    tools.push(
        new DynamicStructuredTool({
            name: "calendar_update_event",
            description: "Update fields of an existing event. Use FLAT arguments. You must get the ID first. Only provide fields you want to change.",
            schema: z.preprocess((val: any) => {
                if (!val || typeof val !== 'object') return val;
                
                const extractDate = (obj: any) => obj?.dateTime || obj?.date;
                
                if (val.event) {
                   return {
                       eventId: val.eventId,
                       summary: val.event.summary,
                       description: val.event.description,
                       startTime: extractDate(val.event.start),
                       endTime: extractDate(val.event.end)
                   };
                }
                
                if (typeof val.start === 'string' && typeof val.end === 'string') {
                    return { ...val, startTime: val.start, endTime: val.end };
                }

                const startVal = extractDate(val.start);
                const endVal = extractDate(val.end);

                if (startVal || endVal) {
                    return {
                        ...val,
                        startTime: startVal,
                        endTime: endVal
                    };
                }
                
                return val;
            }, z.object({
                eventId: z.string().describe("The ID of the event to update."),
                summary: z.string().optional().describe("New title"),
                description: z.string().optional().describe("New description"),
                startTime: z.string().optional().describe("New start time (ISO or date)."),
                endTime: z.string().optional().describe("New end time (ISO or date).")
            })),
            func: async ({ eventId, summary, description, startTime, endTime }) => {
                const client = authService.getAuthenticatedClient();
                if (!client) return "Error: Not authenticated. Use '/auth'.";
                const calendar = google.calendar({ version: 'v3', auth: client });

                try {
                    const requestBody: any = {};
                    if (summary) requestBody.summary = summary;
                    if (description) requestBody.description = description;
                    
                    const isDateOnly = (time: string) => /^\d{4}-\d{2}-\d{2}$/.test(time);
                    const ensureOffset = (time: string) => {
                        if (isDateOnly(time)) return time;
                        if (!time.match(/(Z|[+-]\d{2}(:?\d{2})?)$/)) return time + 'Z';
                        return time;
                    };

                    if (startTime) {
                        const finalStartup = ensureOffset(startTime);
                         requestBody.start = isDateOnly(finalStartup) ? { date: finalStartup } : { dateTime: finalStartup };
                    }
                    if (endTime) {
                         const finalEndTime = ensureOffset(endTime);
                         requestBody.end = isDateOnly(finalEndTime) ? { date: finalEndTime } : { dateTime: finalEndTime };
                    }

                    const res = await calendar.events.patch({
                        calendarId: 'primary',
                        eventId: eventId,
                        requestBody: requestBody,
                    });
                    
                    return `Event updated: ${res.data.htmlLink}`;
                } catch (error: any) {
                    logger.error("Error updating calendar event", error);
                    if (error.response && error.response.data) {
                        logger.error(`Google API Error Details: ${JSON.stringify(error.response.data)}`);
                    }
                    if (error.code === 403 || error.code === 401) {
                             return "Error: Insufficient permissions. Please re-authenticate.";
                        }
                    return `Error updating event: ${error.message}`;
                }
            }
        })
    );

    return tools;
}
