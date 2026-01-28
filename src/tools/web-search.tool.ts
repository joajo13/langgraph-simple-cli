import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { TavilySearch } from '@langchain/tavily';
import { Config } from '../config';

/**
 * Creates a Web Search tool instance using Tavily API.
 * Returns null if no API key is provided.
 * 
 * @param config - Application configuration containing API keys.
 * @returns A DynamicStructuredTool instance or null.
 */
export function createWebSearchTool(config: Config): DynamicStructuredTool | null {
  if (!config.tavilyApiKey) {
    return null;
  }
  
  const tavilySearch = new TavilySearch({
    tavilyApiKey: config.tavilyApiKey,
    maxResults: 5
  });
  
  return new DynamicStructuredTool({
    name: 'web_search',
    description: 'Search the web for current information. Use this for recent news, current events, or real-time data.',
    schema: z.object({
      query: z.string().describe('The search query')
    }),
    func: async ({ query }) => {
      try {
        const results = await tavilySearch.invoke({ query });
        return typeof results === 'string' ? results : JSON.stringify(results);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `Error searching the web: ${errorMessage}`;
      }
    }
  });
}
