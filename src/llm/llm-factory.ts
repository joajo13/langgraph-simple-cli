import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Config, getLLMApiKey } from '../config';

/**
 * Creates an LLM instance based on the provided configuration.
 * 
 * @param config - The application configuration.
 * @returns A configured BaseChatModel instance.
 * @throws Error if the LLM provider is unknown.
 */
export function createLLM(config: Config): BaseChatModel {
  const apiKey = getLLMApiKey(config);
  
  switch (config.llmProvider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey,
        model: config.llmModel,
        temperature: 0.7
      });
    
    case 'anthropic':
      return new ChatAnthropic({
        apiKey,
        model: config.llmModel,
        temperature: 0.7
      });
    
    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey,
        model: config.llmModel,
        temperature: 0.7
      });
    
    default:
      // This should be unreachable if config is validated by Zod
      throw new Error(`Unknown LLM provider: ${(config as any).llmProvider}`);
  }
}

/**
 * Creates an LLM instance enforcing structured output.
 * 
 * @param config - The application configuration.
 * @param schema - The Zod schema or JSON schema for output validation.
 * @returns A configured BaseChatModel with structured output (casted).
 */
export function createLLMWithStructuredOutput<T>(
  config: Config,
  schema: any
): BaseChatModel {
  const llm = createLLM(config);
  // Typescript casting as unknown to ensure compatibility
  return llm.withStructuredOutput(schema) as unknown as BaseChatModel;
}
