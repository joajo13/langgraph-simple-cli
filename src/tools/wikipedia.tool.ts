import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import wikipedia from 'wikipedia';

/**
 * Tool to search Wikipedia and return a summary.
 * Supports English and Spanish.
 */
export const wikipediaTool = new DynamicStructuredTool({
  name: 'wikipedia',
  description: 'Search Wikipedia for information about a topic. Returns a summary of the article.',
  schema: z.object({
    topic: z.string().describe('The topic to search for on Wikipedia'),
    language: z.enum(['en', 'es']).optional().default('es').describe('Language: "en" for English, "es" for Spanish')
  }),
  func: async ({ topic, language }) => {
    try {
      // Set language safely
      try {
        wikipedia.setLang(language || 'es');
      } catch (e) {
        // Fallback or ignore if setLang fails
      }
      
      const searchResults = await wikipedia.search(topic, { limit: 1 });
      
      if (!searchResults.results || searchResults.results.length === 0) {
        return `No Wikipedia article found for "${topic}"`;
      }
      
      const page = await wikipedia.page(searchResults.results[0].title);
      const summary = await page.summary();
      
      // Limit the summary to a reasonable length
      const maxLength = 1000;
      let content = summary.extract;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }
      
      return `**${summary.title}**\n\n${content}\n\nSource: ${summary.content_urls.desktop.page}`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `Error searching Wikipedia: ${errorMessage}`;
    }
  }
});
