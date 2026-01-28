import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LLMProvider, DEFAULT_MODELS } from './config-store';

export async function validateLLMKey(
  provider: LLMProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    let llm;
    
    switch (provider) {
      case 'openai':
        llm = new ChatOpenAI({
          apiKey,
          model: DEFAULT_MODELS.openai,
          maxTokens: 5
        });
        break;
      case 'anthropic':
        llm = new ChatAnthropic({
          apiKey,
          model: DEFAULT_MODELS.anthropic,
          maxTokens: 5
        });
        break;
      case 'google':
        llm = new ChatGoogleGenerativeAI({
          apiKey,
          model: DEFAULT_MODELS.google,
          maxOutputTokens: 5
        });
        break;
      default:
        return { valid: false, error: 'Unknown provider' };
    }

    await llm.invoke([{ role: 'user', content: 'hi' }]);
    return { valid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { valid: false, error: errorMessage || 'Invalid API key' };
  }
}

export async function validateTavilyKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const { TavilySearch } = await import('@langchain/tavily');
    const search = new TavilySearch({
      tavilyApiKey: apiKey,
      maxResults: 1
    });
    await search.invoke({ query: 'test' });
    return { valid: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { valid: false, error: errorMessage || 'Invalid Tavily API key' };
  }
}
