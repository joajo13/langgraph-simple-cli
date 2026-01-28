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
import { fetchModelsForProvider } from './model-fetcher';
import { loadConfig, clearConfig } from './config-store';

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

async function selectModel(provider: LLMProvider, apiKey: string): Promise<string> {
  const defaults = DEFAULT_MODELS[provider];
  const hardcoded = AVAILABLE_MODELS[provider] || [defaults];
  
  const spinner = ora('   Buscando modelos disponibles...').start();
  const dynamicModels = await fetchModelsForProvider(provider, apiKey);
  spinner.stop();
  
  // Merge and deduplicate
  const allModels = Array.from(new Set([...hardcoded, ...dynamicModels]));
  
  console.log(chalk.yellow('\n3️⃣  Selecciona el modelo:'));
  
  const choices = [
    ...allModels.map((m: string) => m === defaults ? `${m} (recomendado)` : m),
    '✏️  Otro (Ingresar manualmente)'
  ];

  const prompt = new Select({
    name: 'model',
    message: 'Elige un modelo',
    choices: choices
  });

  const answer: string = await prompt.run();
  
  if (answer === '✏️  Otro (Ingresar manualmente)') {
     const inputPrompt = new Input({
       name: 'customModel',
       message: 'Ingresa el nombre del modelo (ej: gpt-4-32k)'
     });
     return ((await inputPrompt.run()) as string).trim();
  }

  return answer.replace(' (recomendado)', '');
}

async function inputApiKey(provider: LLMProvider): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const providerInfo = PROVIDERS.find(p => p.value === provider)!;
  
  console.log(chalk.yellow(`\n2️⃣  API Key de ${providerInfo.name.split(' ')[0]}:`));
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

async function inputLogLevel(): Promise<string> {
  const prompt = new Select({
    name: 'logLevel',
    message: '¿Nivel de Logs?',
    choices: ['info (Recomendado)', 'debug (Ver todo)', 'warn (Solo alertas)', 'error (Solo errores)']
  });
  
  const answer = await prompt.run();
  return answer.split(' ')[0];
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
    console.log(chalk.cyan('│') + chalk.white(`  Model:    ${model.padEnd(32)}`) + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.white(`  Logs:     ${logLevel.padEnd(32)}`) + chalk.cyan('│'));
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
  console.clear();
  console.log(chalk.cyan('╭──────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│') + chalk.bold.white('  ⚙️  Configuración del Agente                 ') + chalk.cyan('│'));
  console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
  console.log();

  const currentConfig = loadConfig();
  if (!currentConfig) {
      return runSetupWizard();
  }

  const prompt = new Select({
    name: 'action',
    message: '¿Qué deseas hacer?',
    choices: [
      '🔄 Reconfigurar todo (Wizard completo)',
      '🧠 Cambiar Modelo LLM',
      '🐞 Configurar Logs',
      '🔑 Actualizar API Keys',
      '🗑️  Eliminar/Resetear Configuración',
      '↩️  Cancelar'
    ]
  });

  const action = await prompt.run();

  if (action.startsWith('↩️')) {
      console.log('Operación cancelada.');
      return currentConfig;
  }

  if (action.startsWith('🔄')) {
      return runSetupWizard();
  }

  if (action.startsWith('🧠')) {
      // Change model only
      const provider = currentConfig.llmProvider;
      const apiKey = getApiKeyForProvider(currentConfig, provider);
      
      console.log(chalk.gray(`Proveedor actual: ${provider}`));
      if (!apiKey) {
          console.log(chalk.red('No se encontró API Key válida. Ejecuta la reconfiguración completa.'));
          return runSetupWizard();
      }

      const newModel = await selectModel(provider, apiKey);
      const newConfig = { ...currentConfig, llmModel: newModel, updatedAt: new Date().toISOString() };
      saveConfig(newConfig as Config);
      console.log(chalk.green(`\n✅ Modelo actualizado a: ${newModel}`));
      return newConfig as Config;
  }

  if (action.startsWith('🐞')) {
      const newLevel = await inputLogLevel();
      const newConfig = { ...currentConfig, logLevel: newLevel, updatedAt: new Date().toISOString() };
      saveConfig(newConfig as Config); 
      console.log(chalk.green(`\n✅ Nivel de logs actualizado a: ${newLevel}`));
      return newConfig as Config;
  }

  if (action.startsWith('🔑')) {
      // Update keys only
      console.log(chalk.yellow('\nActualizando API Keys...'));
      const provider = currentConfig.llmProvider;
      const newKey = await inputApiKey(provider);
      
      const newConfig = { ...currentConfig };
      if (provider === 'openai') newConfig.openaiApiKey = newKey;
      if (provider === 'anthropic') newConfig.anthropicApiKey = newKey;
      if (provider === 'google') newConfig.googleApiKey = newKey;
      
      newConfig.updatedAt = new Date().toISOString();
      
      // Optional: Ask for Tavily again?
      const updateTavily = new Select({
          name: 'update',
          message: '¿Actualizar Tavily Key?',
          choices: ['Si', 'No']
      });
      
      if (await updateTavily.run() === 'Si') {
          newConfig.tavilyApiKey = await inputTavilyKey();
      }

      saveConfig(newConfig as Config);
      console.log(chalk.green('\n✅ API Keys actualizadas.'));
      return newConfig as Config; 
  }

  if (action.startsWith('🗑️')) {
      const confirm = new Select({
          name: 'confirm',
          message: '¿Estás seguro? Esto eliminará todas tus API keys y configuraciones.',
          choices: ['No', 'Si, eliminar todo']
      });
      
      if (await confirm.run() === 'Si, eliminar todo') {
          clearConfig();
          console.log(chalk.red('\n🗑️  Configuración eliminada.'));
          console.log(chalk.white('Por favor reinicia el agente para configurar de nuevo.'));
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
