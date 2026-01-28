import { LLMProvider } from './schema';
import { logger } from '../logger';

/**
 * Fetches available models for a given provider.
 * Returns an empty array if fetching fails or is not supported.
 */
export async function fetchModelsForProvider(provider: LLMProvider, apiKey: string): Promise<string[]> {
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        logger.warn(`[ModelFetcher] OpenAI fetch failed: ${response.statusText}`);
        return [];
      }

      const data = await response.json() as any;
      if (!data.data || !Array.isArray(data.data)) return [];

      return data.data
        .filter((model: any) => 
            (model.id.includes('gpt-3.5') || model.id.includes('gpt-4') || model.id.includes('o1')) &&
            !model.id.includes('instruct') // Filter out legacy instruct models
        )
        .map((model: any) => model.id)
        .sort();
    }
    
    if (provider === 'google') {
       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
       
       if (!response.ok) {
         logger.warn(`[ModelFetcher] Google fetch failed: ${response.statusText}`);
         return [];
       }

       const data = await response.json() as any;
       if (!data.models || !Array.isArray(data.models)) return [];

       return data.models
         .map((m: any) => m.name.replace('models/', ''))
         .filter((n: string) => n.includes('gemini'))
         .sort();
    }
    
    // Anthropic does not have a simple public models endpoint for API keys yet
    return [];
    
  } catch (error) {
    logger.warn(`[ModelFetcher] Failed to fetch models for ${provider}: ${error}`);
    return [];
  }
}
