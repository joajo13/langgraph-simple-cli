import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { Config, ConfigSchema, LLMProvider } from './schema';
import { logger } from '../logger';

dotenv.config();

const CONFIG_DIR = path.join(os.homedir(), '.research-assistant');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export { Config, LLMProvider };

export function configExists(): boolean {
  // We consider config exists if we have valid ENV vars OR a config file
  // For backwards compatibility, we check file. 
  // But ideally, we validate if we can satisfy the schema.
  if (fs.existsSync(CONFIG_FILE)) return true;
  
  // Check minimal ENV vars
  const hasEnv = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY);
  return hasEnv;
}

export function loadConfig(): Config | null {
  let loadedConfig: any = {};

  // 1. Load from file if exists (lower priority than ENV in typical 12-factor, but here we merge)
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const fileData = fs.readFileSync(CONFIG_FILE, 'utf-8');
      loadedConfig = JSON.parse(fileData);
    } catch (e) {
      logger.error('Failed to parse config file', e);
    }
  }

  // 2. Load from Env (Override file)
  if (process.env.LLM_PROVIDER) loadedConfig.llmProvider = process.env.LLM_PROVIDER;
  if (process.env.LLM_MODEL) loadedConfig.llmModel = process.env.LLM_MODEL;
  if (process.env.OPENAI_API_KEY) loadedConfig.openaiApiKey = process.env.OPENAI_API_KEY;
  if (process.env.ANTHROPIC_API_KEY) loadedConfig.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.GOOGLE_API_KEY) loadedConfig.googleApiKey = process.env.GOOGLE_API_KEY;
  if (process.env.GOOGLE_API_KEY) loadedConfig.googleApiKey = process.env.GOOGLE_API_KEY;
  if (process.env.TAVILY_API_KEY) loadedConfig.tavilyApiKey = process.env.TAVILY_API_KEY;
  if (process.env.LOG_LEVEL) loadedConfig.logLevel = process.env.LOG_LEVEL;
  
  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID) loadedConfig.googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (process.env.GOOGLE_CLIENT_SECRET) loadedConfig.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (process.env.GMAIL_REDIRECT_URI) loadedConfig.gmailRedirectUri = process.env.GMAIL_REDIRECT_URI;

  // 3. Validate
  const result = ConfigSchema.safeParse(loadedConfig);
  
  if (!result.success) {
    logger.warn('Configuration validation failed', result.error.issues);
    return null;
  }

  return result.data;
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  // We only save to file, we don't write to .env
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    logger.info(`Deleted config file at ${CONFIG_FILE}`);
  }
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getLLMApiKey(config: Config): string {
  switch (config.llmProvider) {
    case 'openai':
      return config.openaiApiKey || '';
    case 'anthropic':
      return config.anthropicApiKey || '';
    case 'google':
      return config.googleApiKey || '';
    default:
      return '';
  }
}

export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  google: 'gemini-1.5-flash'
} as const;

export const AVAILABLE_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash']
} as const;

