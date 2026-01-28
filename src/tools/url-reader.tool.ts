import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

/**
 * Tool for reading and extracting main content from a URL.
 * Uses Cheerio to parse HTML and remove clutter.
 */
export const urlReaderTool = new DynamicStructuredTool({
  name: 'url_reader',
  description: 'Read and extract the main text content from a webpage URL.',
  schema: z.object({
    url: z.string().url().describe('The URL to read content from')
  }),
  func: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        return `Error: HTTP ${response.status} - ${response.statusText}`;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove script, style, and other non-content elements
      $('script, style, nav, footer, header, aside, .sidebar, .advertisement').remove();
      
      // Get the main content
      let content = '';
      
      // Try common content selectors
      const contentSelectors = ['article', 'main', '.content', '.post', '#content', '.article-body'];
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }
      
      // Fallback to body
      if (!content) {
        content = $('body').text();
      }
      
      // Clean up whitespace
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      // Limit length
      const maxLength = 2000;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }
      
      const title = $('title').text() || 'No title';
      
      return `**${title}**\n\nURL: ${url}\n\n${content}`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `Error reading URL: ${errorMessage}`;
    }
  }
});
