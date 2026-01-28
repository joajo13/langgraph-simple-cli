import { StructuredTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from 'googleapis';
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { AuthService } from "../../services/auth.service";
import { logger } from "../../logger";

export class CalendarSkill extends BaseSkill {
  
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return true; // Always available to check auth
  }

  getTools(config: Config): StructuredTool[] {
    const tools: StructuredTool[] = [];
    
    // Auth Service
    const authService = new AuthService(config);
    const authClient = authService.getAuthenticatedClient();

    if (authClient) {
        const calendar = google.calendar({ version: 'v3', auth: authClient });

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
                            return "Error: Insufficient permissions. Please tell the user they need to re-authenticate to grant Calendar access. They can do this by running the '/auth' command or deleting the .token.json file.";
                        }
                        return `Error fetching events: ${error.message}`;
                    }
                }
            })
        );

        tools.push(
            new DynamicStructuredTool({
                name: "calendar_create_event",
                description: "Create a new event in the primary calendar.",
                schema: z.object({
                    summary: z.string().describe("Title of the event"),
                    description: z.string().optional().describe("Description of the event"),
                    startTime: z.string().describe("Start time in ISO format (e.g. 2023-10-27T10:00:00Z)"),
                    endTime: z.string().describe("End time in ISO format (e.g. 2023-10-27T11:00:00Z)")
                }),
                func: async ({ summary, description, startTime, endTime }) => {
                    try {
                        const event = {
                            summary,
                            description,
                            start: { dateTime: startTime },
                            end: { dateTime: endTime },
                        };
                        const res = await calendar.events.insert({
                            calendarId: 'primary',
                            requestBody: event,
                        });
                        return `Event created: ${res.data.htmlLink}`;
                    } catch (error: any) {
                        logger.error("Error creating calendar event", error);
                        if (error.code === 403 || error.code === 401 || (error.message && error.message.includes('insufficient'))) {
                             return "Error: Insufficient permissions to create events. Please tell the user to re-authenticate using '/auth'.";
                        }
                        return `Error creating event: ${error.message}`;
                    }
                }
            })
        );
    }

    return tools;
  }
}
