import chalk from 'chalk';
import * as p from '@clack/prompts';
import {
  Config,
  LLMProvider,
  saveConfig,
  DEFAULT_MODELS,
  AVAILABLE_MODELS
} from './config-store';
import { validateLLMKey, validateTavilyKey } from './validators';
import { AuthService } from '../services/auth.service';
import { fetchModelsForProvider } from './model-fetcher';
import { loadConfig, clearConfig } from './config-store';

const PROVIDERS: { label: string; value: LLMProvider; url: string }[] = [
  { label: 'OpenAI (GPT-4o)', value: 'openai', url: 'https://platform.openai.com/api-keys' },
  { label: 'Anthropic (Claude)', value: 'anthropic', url: 'https://console.anthropic.com/' },
  { label: 'Google (Gemini)', value: 'google', url: 'https://aistudio.google.com/apikey' }
];

async function selectProvider(): Promise<LLMProvider> {
  const answer = await p.select({
    message: 'Select your LLM provider:',
    options: PROVIDERS.map(p => ({ label: p.label, value: p.value }))
  });

  if (p.isCancel(answer)) {
    process.exit(0);
  }

  return answer as LLMProvider;
}

async function selectModel(provider: LLMProvider, apiKey: string): Promise<string> {
  const defaults = DEFAULT_MODELS[provider];
  const hardcoded = AVAILABLE_MODELS[provider] || [defaults];
  
  const s = p.spinner();
  s.start('Fetching available models...');
  const dynamicModels = await fetchModelsForProvider(provider, apiKey);
  s.stop('Models fetched.');
  
  // Merge and deduplicate
  const allModels = Array.from(new Set([...hardcoded, ...dynamicModels]));
  
  const choices = [
    ...allModels.map((m: string) => ({ 
      label: m === defaults ? `${m} (recommended)` : m, 
      value: m 
    })),
    { label: '✏️  Other (Enter manually)', value: 'custom' }
  ];

  const answer = await p.select({
    message: 'Select the model:',
    options: choices
  });

  if (p.isCancel(answer)) process.exit(0);
  
  if (answer === 'custom') {
     const customModel = await p.text({
       message: 'Enter the model name (e.g., gpt-4-32k)',
       placeholder: 'gpt-4-turbo'
     });
     if (p.isCancel(customModel)) process.exit(0);
     return (customModel as string).trim();
  }

  return answer as string;
}

async function inputApiKey(provider: LLMProvider): Promise<string> {
  const providerInfo = PROVIDERS.find(p => p.value === provider)!;
  
  p.note(`Get your API key at: ${providerInfo.url}`, `API Key for ${providerInfo.label.split(' ')[0]}`);
  
  while (true) {
    const apiKey = await p.text({
      message: 'Enter your API key:',
      validate: (value) => {
        if (!value) return 'API key is required.';
      }
    });

    if (p.isCancel(apiKey)) process.exit(0);
    
    const s = p.spinner();
    s.start('Validating...');
    const result = await validateLLMKey(provider, apiKey as string);
    
    if (result.valid) {
      s.stop(chalk.green('Connected successfully!'));
      return apiKey as string;
    } else {
      s.stop(chalk.red(`Error: ${result.error}`));
    }
  }
}

async function inputTavilyKey(): Promise<string | undefined> {
  const apiKey = await p.text({
    message: 'Tavily API Key (optional, for web search):',
    placeholder: 'Enter to skip',
  });

  if (p.isCancel(apiKey)) process.exit(0);
  
  if (!apiKey) {
    p.log.warn('Skipped - web_search tool will not be available.');
    return undefined;
  }
  
  const s = p.spinner();
  s.start('Validating...');
  const result = await validateTavilyKey(apiKey as string);
  
  if (result.valid) {
    s.stop(chalk.green('Connected successfully!'));
    return apiKey as string;
  } else {
    s.stop(chalk.yellow(`Warning: ${result.error} - continuing without Tavily`));
    return undefined;
  }
}

async function setupGmail(): Promise<Partial<Config>> {
  const setup = await p.confirm({
    message: 'Do you want to configure Gmail integration?',
    initialValue: false
  });
  
  if (p.isCancel(setup) || !setup) return {};

  const googleClientId = await p.text({ message: 'Google Client ID' });
  if (p.isCancel(googleClientId)) process.exit(0);
  
  const googleClientSecret = await p.text({ message: 'Google Client Secret' });
  if (p.isCancel(googleClientSecret)) process.exit(0);

  const login = await p.confirm({
    message: 'Log in now to generate tokens?',
    initialValue: true
  });
  
  if (!p.isCancel(login) && login) {
      const tempConfig = {
          googleClientId: (googleClientId as string).trim(),
          googleClientSecret: (googleClientSecret as string).trim(),
          gmailRedirectUri: 'http://localhost:3000/oauth2callback'
      } as Config;
      
      const auth = new AuthService(tempConfig);
      await auth.loginWithLocalServer();
  }
  
  return { 
    googleClientId: (googleClientId as string).trim(), 
    googleClientSecret: (googleClientSecret as string).trim() 
  };
}

async function inputLogLevel(): Promise<string> {
  const answer = await p.select({
    message: 'Select log level:',
    options: [
      { label: 'info (Recommended)', value: 'info' },
      { label: 'debug (Verbose)', value: 'debug' },
      { label: 'warn (Warnings only)', value: 'warn' },
      { label: 'error (Errors only)', value: 'error' },
      { label: 'silent (No logs)', value: 'silent' }
    ]
  });
  
  if (p.isCancel(answer)) process.exit(0);
  return answer as string;
}

export async function runSetupWizard(): Promise<Config> {
  p.intro(chalk.bgCyan.black(' SIMPLE CLI - Setup Wizard '));
  p.log.info(chalk.gray('Keys are stored locally and never shared.'));
  
  try {
    const provider = await selectProvider();
    const llmApiKey = await inputApiKey(provider);
    const model = await selectModel(provider, llmApiKey);
    const tavilyApiKey = await inputTavilyKey();
    const gmailConfig = await setupGmail();
    const logLevel = await inputLogLevel();
    
    const config: Config = {
      llmProvider: provider,
      llmModel: model,
      tavilyApiKey,
      logLevel: logLevel as any,
      gmailRedirectUri: 'http://localhost:3000/oauth2callback',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...gmailConfig
    };
    
    switch (provider) {
      case 'openai': config.openaiApiKey = llmApiKey; break;
      case 'anthropic': config.anthropicApiKey = llmApiKey; break;
      case 'google': config.googleApiKey = llmApiKey; break;
    }
    
    saveConfig(config);
    
    p.note(
      `Provider: ${provider}\n` +
      `Model:    ${model}\n` +
      `Logs:     ${logLevel}\n` +
      `Tavily:   ${tavilyApiKey ? '✅ Configured' : '❌ Not configured'}\n` +
      `Gmail:    ${gmailConfig.googleClientId ? '✅ Configured' : '❌ Not configured'}`,
      'Configuration Saved'
    );
    
    p.outro(chalk.green('Setup complete! Happy hacking.'));
    
    return config;
  } catch (error) {
    p.log.error(chalk.red('Setup failed or cancelled.'));
    process.exit(1);
  }
}

export async function reconfigureWizard(): Promise<Config> {
  p.intro(chalk.bgCyan.black(' Agent Settings '));

  const currentConfig = loadConfig();
  if (!currentConfig) {
      return runSetupWizard();
  }

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { label: '🔄 Reconfigure everything', value: 'full' },
      { label: '🧠 Change LLM Model', value: 'model' },
      { label: '🐞 Configure Logs', value: 'logs' },
      { label: '🔑 Update API Keys', value: 'keys' },
      { label: '🗑️  Reset Configuration', value: 'reset' },
      { label: '↩️  Cancel', value: 'cancel' }
    ]
  });

  if (p.isCancel(action) || action === 'cancel') {
      return currentConfig;
  }

  if (action === 'full') {
      return runSetupWizard();
  }

  if (action === 'model') {
      const provider = currentConfig.llmProvider;
      const apiKey = getApiKeyForProvider(currentConfig, provider);
      
      if (!apiKey) {
          p.log.error('No valid API key found. Run full reconfiguration.');
          return runSetupWizard();
      }

      const newModel = await selectModel(provider, apiKey);
      const newConfig = { ...currentConfig, llmModel: newModel, updatedAt: new Date().toISOString() };
      saveConfig(newConfig as Config);
      p.log.success(`Model updated to: ${newModel}`);
      return newConfig as Config;
  }

  if (action === 'logs') {
      const newLevel = await inputLogLevel();
      const newConfig = { ...currentConfig, logLevel: newLevel, updatedAt: new Date().toISOString() };
      saveConfig(newConfig as Config); 
      p.log.success(`Log level updated to: ${newLevel}`);
      return newConfig as Config;
  }

  if (action === 'keys') {
      const provider = currentConfig.llmProvider;
      const newKey = await inputApiKey(provider);
      
      const newConfig = { ...currentConfig };
      if (provider === 'openai') newConfig.openaiApiKey = newKey;
      if (provider === 'anthropic') newConfig.anthropicApiKey = newKey;
      if (provider === 'google') newConfig.googleApiKey = newKey;
      
      newConfig.updatedAt = new Date().toISOString();
      
      const updateTavily = await p.confirm({ message: 'Update Tavily Key?' });
      if (!p.isCancel(updateTavily) && updateTavily) {
          newConfig.tavilyApiKey = await inputTavilyKey();
      }

      saveConfig(newConfig as Config);
      p.log.success('API Keys updated.');
      return newConfig as Config; 
  }

  if (action === 'reset') {
      const confirm = await p.confirm({
          message: 'Are you sure? This will delete all API keys and settings.',
          initialValue: false
      });
      
      if (!p.isCancel(confirm) && confirm) {
          clearConfig();
          p.log.error('Configuration deleted.');
          p.outro('Please restart the agent to reconfigure.');
          process.exit(0);
      }
      return currentConfig;
  }

  return currentConfig;
}

function getApiKeyForProvider(config: Config, provider: LLMProvider): string {
    switch (provider) {
        case 'openai': return config.openaiApiKey || '';
        case 'anthropic': return config.anthropicApiKey || '';
        case 'google': return config.googleApiKey || '';
        default: return '';
    }
}
