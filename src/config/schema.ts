import { z } from 'zod';

export const LLMProviderSchema = z.enum(['openai', 'anthropic', 'google']);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

/**
 * Zod schema for the application configuration.
 * Defines all required environment variables and configuration options.
 */
export const ConfigSchema = z.object({
  // LLM Configuration
  llmProvider: LLMProviderSchema.default('openai'),
  llmModel: z.string().min(1).default('gpt-4o-mini'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  tavilyApiKey: z.string().optional(),

  // Google OAuth Configuration
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  gmailRedirectUri: z.string().default('http://localhost:3000/oauth2callback'),

  // Metadata
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
.transform((data) => {
  return data;
})
.refine((data) => {
  if (data.llmProvider === 'openai' && !data.openaiApiKey) return false;
  if (data.llmProvider === 'anthropic' && !data.anthropicApiKey) return false;
  if (data.llmProvider === 'google' && !data.googleApiKey) return false;
  return true;
}, {
  message: "API Key for the selected LLM provider is missing",
  path: ["llmProvider"] // Attaches error to this field
});

export type Config = z.infer<typeof ConfigSchema>;
