import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const COMMON_TIMEZONES: Record<string, string> = {
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'argentina': 'America/Argentina/Buenos_Aires',
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'tokyo': 'Asia/Tokyo',
  'sydney': 'Australia/Sydney',
  'dubai': 'Asia/Dubai',
  'singapore': 'Asia/Singapore',
  'hong kong': 'Asia/Hong_Kong',
  'moscow': 'Europe/Moscow',
  'sao paulo': 'America/Sao_Paulo',
  'mexico city': 'America/Mexico_City',
  'utc': 'UTC'
};

/**
 * Resolves a city name or alias to a valid IANA timezone string.
 * @param input - The city name or timezone identifier.
 * @returns The resolved timezone string.
 */
function resolveTimezone(input: string): string {
  const lowered = input.toLowerCase().trim();
  return COMMON_TIMEZONES[lowered] || input;
}

/**
 * Tool to get the current date and time in a specific timezone.
 */
export const datetimeTool = new DynamicStructuredTool({
  name: 'get_datetime',
  description: 'Get the current date and time in a specific timezone. Use city names like "Tokyo", "London", "Buenos Aires" or IANA timezone identifiers.',
  schema: z.object({
    timezone: z.string().optional().default('UTC').describe('Timezone name (city) or IANA identifier, e.g., "Tokyo", "America/New_York"'),
    format: z.enum(['full', 'date', 'time']).optional().default('full').describe('Output format: full (date and time), date only, or time only')
  }),
  func: async ({ timezone, format }) => {
    try {
      const tz = resolveTimezone(timezone);
      const now = new Date();
      
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        weekday: format === 'full' ? 'long' : undefined,
        year: format !== 'time' ? 'numeric' : undefined,
        month: format !== 'time' ? 'long' : undefined,
        day: format !== 'time' ? 'numeric' : undefined,
        hour: format !== 'date' ? '2-digit' : undefined,
        minute: format !== 'date' ? '2-digit' : undefined,
        second: format !== 'date' ? '2-digit' : undefined,
        timeZoneName: format === 'full' ? 'short' : undefined
      };
      
      // Remove undefined properties
      (Object.keys(options) as (keyof Intl.DateTimeFormatOptions)[]).forEach(key => {
        if (options[key] === undefined) {
          delete options[key];
        }
      });
      
      const formatter = new Intl.DateTimeFormat('es-ES', options);
      const formatted = formatter.format(now);
      
      return `${formatted} (${tz})`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error getting datetime: ${errorMessage}. Make sure the timezone is valid.`;
    }
  }
});
