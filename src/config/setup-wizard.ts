import chalk from 'chalk';
import ora from 'ora';
import Enquirer from 'enquirer';
import {
  Config,
  LLMProvider,
  saveConfig,
  DEFAULT_MODELS,
  AVAILABLE_MODELS
} from './config-store';
import { validateLLMKey, validateTavilyKey } from './validators';
import { AuthService } from '../services/auth.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Select, Input } = Enquirer as any;

const PROVIDERS: { name: string; value: LLMProvider; url: string }[] = [
  { name: 'OpenAI (GPT-4o)', value: 'openai', url: 'https://platform.openai.com/api-keys' },
  { name: 'Anthropic (Claude)', value: 'anthropic', url: 'https://console.anthropic.com/' },
  { name: 'Google (Gemini)', value: 'google', url: 'https://aistudio.google.com/apikey' }
];

async function selectProvider(): Promise<LLMProvider> {
  console.log(chalk.yellow('\n1️⃣  Selecciona tu proveedor de LLM:'));
  
  const prompt = new Select({
    name: 'provider',
    message: 'Elige un proveedor',
    choices: PROVIDERS.map(p => p.name)
  });

  const answer = await prompt.run();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const selected = PROVIDERS.find(p => p.name === answer)!;
  return selected.value;
}

async function selectModel(provider: LLMProvider): Promise<string> {
  const models = AVAILABLE_MODELS[provider];
  const defaultModel = DEFAULT_MODELS[provider];
  
  console.log(chalk.yellow('\n2️⃣  Selecciona el modelo:'));
  
  const prompt = new Select({
    name: 'model',
    message: 'Elige un modelo',
    choices: models.map((m: string) => m === defaultModel ? `${m} (recomendado)` : m)
  });

  const answer: string = await prompt.run();
  return answer.replace(' (recomendado)', '');
}

async function inputApiKey(provider: LLMProvider): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const providerInfo = PROVIDERS.find(p => p.value === provider)!;
  
  console.log(chalk.yellow(`\n3️⃣  API Key de ${providerInfo.name.split(' ')[0]}:`));
  console.log(chalk.gray(`   Obtener en: ${providerInfo.url}`));
  
  while (true) {
    const prompt = new Input({
      name: 'apiKey',
      message: 'Ingresa tu API key'
    });

    const apiKey = ((await prompt.run()) as string).trim();
    
    if (!apiKey) {
      console.log(chalk.red('   ❌ La API key es requerida.'));
      continue;
    }
    
    const spinner = ora('   Validando...').start();
    const result = await validateLLMKey(provider, apiKey);
    
    if (result.valid) {
      spinner.succeed(chalk.green('   ¡Conectado correctamente!'));
      return apiKey;
    } else {
      spinner.fail(chalk.red(`   Error: ${result.error}`));
    }
  }
}

async function inputTavilyKey(): Promise<string | undefined> {
  console.log(chalk.yellow('\n4️⃣  Tavily API Key (opcional, para búsqueda web):'));
  console.log(chalk.gray('   Obtener en: https://tavily.com'));
  console.log(chalk.gray('   Free tier: 1000 búsquedas/mes'));
  
  const prompt = new Input({
    name: 'apiKey',
    message: 'Ingresa tu key (Enter para omitir)'
  });

  const apiKey = ((await prompt.run()) as string).trim();
  
  if (!apiKey) {
    console.log(chalk.gray('   ⏭️  Omitido - web_search tool no estará disponible'));
    return undefined;
  }
  
  const spinner = ora('   Validando...').start();
  const result = await validateTavilyKey(apiKey);
  
  if (result.valid) {
    spinner.succeed(chalk.green('   ¡Conectado correctamente!'));
    return apiKey;
  } else {
    spinner.warn(chalk.yellow(`   Advertencia: ${result.error} - continuando sin Tavily`));
    return undefined;
  }
}

async function setupGmail(): Promise<Partial<Config>> {
  console.log(chalk.yellow('\n5️⃣  Integración con Gmail (Opcional):'));
  console.log(chalk.gray('   Necesitas Client ID y Secret desde Google Cloud Console.'));
  
  const confirmPrompt = new Select({
    name: 'setup',
    message: '¿Deseas configurar Gmail para leer/enviar correos?',
    choices: ['Si', 'No']
  });
  
  const setup = await confirmPrompt.run() === 'Si';
  if (!setup) return {};

  const idPrompt = new Input({ message: 'Google Client ID', name: 'clientId' });
  const googleClientId = ((await idPrompt.run()) as string).trim();
  
  const secretPrompt = new Input({ message: 'Google Client Secret', name: 'clientSecret' });
  const googleClientSecret = ((await secretPrompt.run()) as string).trim();

  // Validate or try login
   const loginPrompt = new Select({
    name: 'login',
    message: '¿Iniciar sesión ahora para generar tokens?',
    choices: ['Si', 'No - Hacerlo luego']
  });
  
  if (await loginPrompt.run() === 'Si') {
      const tempConfig = {
          googleClientId,
          googleClientSecret,
          gmailRedirectUri: 'http://localhost:3000/oauth2callback'
      } as Config;
      
      const auth = new AuthService(tempConfig);
      await auth.loginWithLocalServer();
  }
  
  return { googleClientId, googleClientSecret };
}

export async function runSetupWizard(): Promise<Config> {
  console.clear();
  console.log(chalk.cyan('╭──────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│') + chalk.bold.white('  🔬 Research Assistant - Setup Wizard        ') + chalk.cyan('│'));
  console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
  console.log();
  console.log(chalk.gray('   Las API keys se guardarán localmente y nunca se comparten.'));
  
  try {
    const provider = await selectProvider();
    const model = await selectModel(provider);
    const llmApiKey = await inputApiKey(provider);
    const tavilyApiKey = await inputTavilyKey();
    const gmailConfig = await setupGmail();
    
    const config: Config = {
      llmProvider: provider,
      llmModel: model,
      tavilyApiKey,
      gmailRedirectUri: 'http://localhost:3000/oauth2callback',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...gmailConfig
    };
    
    // Set the appropriate API key
    switch (provider) {
      case 'openai':
        config.openaiApiKey = llmApiKey;
        break;
      case 'anthropic':
        config.anthropicApiKey = llmApiKey;
        break;
      case 'google':
        config.googleApiKey = llmApiKey;
        break;
    }
    
    saveConfig(config);
    
    console.log(chalk.cyan('\n╭──────────────────────────────────────────────╮'));
    console.log(chalk.cyan('│') + chalk.bold.green('  ✅ Configuración completada                 ') + chalk.cyan('│'));
    console.log(chalk.cyan('├──────────────────────────────────────────────┤'));
    console.log(chalk.cyan('│') + chalk.white(`  Provider: ${provider.padEnd(32)}`) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.white(`  Model:    ${model.padEnd(32)}`) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.white(`  Tavily:   ${tavilyApiKey ? '✅ Configurado' : '❌ No configurado'}`.padEnd(44)) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.white(`  Gmail:    ${gmailConfig.googleClientId ? '✅ Configurado' : '❌ No configurado'}`.padEnd(44)) + chalk.cyan('│'));
    console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
    console.log();
    
    return config;
  } catch (error) {
    console.log(chalk.red('\n❌ Configuración cancelada.'));
    process.exit(1);
  }
}

export async function reconfigureWizard(): Promise<Config> {
  // We can ignore specific previous config on re-run for simplicity
  return runSetupWizard();
}
