# API Keys Configuration Specification

## Overview

Sistema de configuración interactivo que solicita API keys al primer inicio y las persiste para futuros usos.

---

## Archivos

- `src/config/setup-wizard.ts` - Wizard interactivo
- `src/config/config-store.ts` - Persistencia de config
- `src/config/validators.ts` - Validación de keys

---

## Flujo de Configuración

```
┌─────────────────────────────────────────────────────────────────┐
│                          INICIO                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ ¿Existe config.json?  │
              └───────────┬───────────┘
                     │         │
                    YES        NO
                     │         │
                     ▼         ▼
         ┌───────────────┐  ┌───────────────────┐
         │  Cargar keys  │  │  Setup Wizard     │
         └───────┬───────┘  └─────────┬─────────┘
                 │                    │
                 ▼                    ▼
         ┌───────────────┐  ┌───────────────────┐
         │ Validar keys  │  │ Solicitar keys    │
         └───────┬───────┘  └─────────┬─────────┘
                 │                    │
            ┌────┴────┐               ▼
           VALID    INVALID   ┌───────────────────┐
            │         │       │  Validar c/key    │
            │         │       └─────────┬─────────┘
            │         ▼                 │
            │    ┌─────────────┐        ▼
            │    │Setup Wizard │  ┌───────────────────┐
            │    └─────────────┘  │  Guardar config   │
            │                     └─────────┬─────────┘
            │                               │
            └───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   INICIAR AGENTE      │
              └───────────────────────┘
```

---

## Setup Wizard

### Pantalla Inicial

```
╭──────────────────────────────────────────────╮
│  🔬 Research Assistant - Setup Wizard        │
╰──────────────────────────────────────────────╯

👋 ¡Bienvenido! Necesito configurar algunas API keys.

📝 Las keys se guardarán localmente y nunca se comparten.
```

### Solicitar OpenAI Key (Requerida)

```
1️⃣ OpenAI API Key (requerida para el agente)

   Obtener en: https://platform.openai.com/api-keys
   
   → Ingresa tu key: sk-█

   ⏳ Validando...
   ✅ ¡Conectado correctamente! (gpt-4o-mini disponible)
```

### Solicitar Tavily Key (Opcional)

```
2️⃣ Tavily API Key (opcional, para búsqueda web)

   Obtener en: https://tavily.com
   Free tier: 1000 búsquedas/mes
   
   → Ingresa tu key (Enter para omitir): tvly-█

   ⏳ Validando...
   ✅ ¡Conectado correctamente!
```

### Confirmación Final

```
╭──────────────────────────────────────────────╮
│  ✅ Configuración completada                 │
├──────────────────────────────────────────────┤
│  OpenAI:  ✅ Configurado                     │
│  Tavily:  ✅ Configurado                     │
╰──────────────────────────────────────────────╯

💾 Guardado en: ~/.research-assistant/config.json

Presiona Enter para continuar...
```

---

## Config Store

### Ubicación

```
~/.research-assistant/config.json
```

En Docker:
```
/root/.research-assistant/config.json
```

### Estructura

```typescript
interface Config {
  // LLM Provider
  llmProvider: 'openai' | 'anthropic' | 'google';
  llmModel: string;
  
  // API Keys (solo la del provider elegido es requerida)
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  
  // Tools
  tavilyApiKey?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### Ejemplo

```json
{
  "llmProvider": "anthropic",
  "llmModel": "claude-3-5-sonnet-20241022",
  "anthropicApiKey": "sk-ant-...",
  "tavilyApiKey": "tvly-...",
  "createdAt": "2024-01-27T10:30:00.000Z",
  "updatedAt": "2024-01-27T10:30:00.000Z"
}
```

---

## Implementación

### config-store.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.research-assistant');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  openaiApiKey: string;
  tavilyApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE);
}

export function loadConfig(): Config | null {
  if (!configExists()) return null;
  const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
```

### validators.ts

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearchResults } from '@langchain/tavily';

export async function validateOpenAIKey(key: string): Promise<boolean> {
  try {
    const llm = new ChatOpenAI({ 
      apiKey: key, 
      model: 'gpt-4o-mini',
      maxTokens: 5
    });
    await llm.invoke([{ role: 'user', content: 'hi' }]);
    return true;
  } catch {
    return false;
  }
}

export async function validateTavilyKey(key: string): Promise<boolean> {
  try {
    const search = new TavilySearchResults({ 
      apiKey: key,
      maxResults: 1
    });
    await search.invoke('test');
    return true;
  } catch {
    return false;
  }
}
```

### setup-wizard.ts

```typescript
import { prompt } from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { saveConfig } from './config-store';
import { validateOpenAIKey, validateTavilyKey } from './validators';

export async function runSetupWizard(): Promise<void> {
  console.log(chalk.cyan('╭──────────────────────────────────────────────╮'));
  console.log(chalk.cyan('│') + '  🔬 Research Assistant - Setup Wizard        ' + chalk.cyan('│'));
  console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
  console.log();
  
  // OpenAI Key
  const { openaiKey } = await prompt<{ openaiKey: string }>({
    type: 'password',
    name: 'openaiKey',
    message: 'OpenAI API Key (requerida):',
    validate: async (value) => {
      if (!value.startsWith('sk-')) return 'Key debe comenzar con sk-';
      const spinner = ora('Validando...').start();
      const valid = await validateOpenAIKey(value);
      spinner.stop();
      return valid || 'Key inválida';
    }
  });
  
  // Tavily Key (opcional)
  const { tavilyKey } = await prompt<{ tavilyKey: string }>({
    type: 'password',
    name: 'tavilyKey',
    message: 'Tavily API Key (Enter para omitir):',
  });
  
  // Guardar
  saveConfig({
    openaiApiKey: openaiKey,
    tavilyApiKey: tavilyKey || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log(chalk.green('\n✅ Configuración guardada!\n'));
}
```

---

## Seguridad

| Aspecto | Implementación |
|---------|----------------|
| Almacenamiento | Archivo local con permisos 600 |
| Transmisión | Keys nunca se logean ni envían a terceros |
| Input | Password input (caracteres ocultos) |
| Validación | Test call antes de guardar |
