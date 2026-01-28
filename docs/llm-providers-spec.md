# LLM Providers Specification

## Overview

El agente soporta múltiples proveedores de LLM. El usuario elige cuál usar durante el setup.

---

## Providers Soportados

| Provider | Paquete | Modelos |
|----------|---------|---------|
| OpenAI | `@langchain/openai` | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Anthropic | `@langchain/anthropic` | claude-3-5-sonnet, claude-3-haiku |
| Google | `@langchain/google-genai` | gemini-1.5-pro, gemini-1.5-flash |

---

## Configuración

### Config Schema

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

### Ejemplo config.json

```json
{
  "llmProvider": "anthropic",
  "llmModel": "claude-3-5-sonnet-20241022",
  "anthropicApiKey": "sk-ant-...",
  "tavilyApiKey": "tvly-...",
  "createdAt": "2024-01-27T10:00:00Z",
  "updatedAt": "2024-01-27T10:00:00Z"
}
```

---

## Setup Wizard Flow

```
╭──────────────────────────────────────────────╮
│  🔬 Research Assistant - Setup Wizard        │
╰──────────────────────────────────────────────╯

1️⃣ Selecciona tu proveedor de LLM:

   ❯ OpenAI     (GPT-4o, GPT-4o-mini)
     Anthropic  (Claude 3.5 Sonnet, Claude 3 Haiku)
     Google     (Gemini 1.5 Pro, Gemini 1.5 Flash)

2️⃣ Selecciona el modelo:

   ❯ claude-3-5-sonnet-20241022 (recomendado)
     claude-3-haiku-20240307

3️⃣ API Key de Anthropic:
   Obtener en: https://console.anthropic.com/
   
   → sk-ant-...
   ✅ ¡Conectado!

4️⃣ Tavily API Key (opcional):
   → tvly-...
   ✅ ¡Conectado!

💾 Configuración guardada!
```

---

## LLM Factory

**Archivo**: `src/llm/llm-factory.ts`

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Config } from '../config/config-store';

export function createLLM(config: Config): BaseChatModel {
  switch (config.llmProvider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: config.openaiApiKey,
        model: config.llmModel,
      });
    
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: config.anthropicApiKey,
        model: config.llmModel,
      });
    
    case 'google':
      return new ChatGoogleGenerativeAI({
        apiKey: config.googleApiKey,
        model: config.llmModel,
      });
    
    default:
      throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
  }
}
```

---

## Modelos Disponibles

### OpenAI

| Modelo | Descripción | Costo |
|--------|-------------|-------|
| `gpt-4o` | Mejor calidad | $$$ |
| `gpt-4o-mini` | Balance calidad/costo | $ |
| `gpt-4-turbo` | Turbo con vision | $$ |

### Anthropic

| Modelo | Descripción | Costo |
|--------|-------------|-------|
| `claude-3-5-sonnet-20241022` | Mejor balance | $$ |
| `claude-3-haiku-20240307` | Rápido y económico | $ |

### Google

| Modelo | Descripción | Costo |
|--------|-------------|-------|
| `gemini-1.5-pro` | Mayor contexto | $$ |
| `gemini-1.5-flash` | Rápido | $ |

---

## Validación de Keys

```typescript
// validators.ts

export async function validateLLMKey(
  provider: string, 
  apiKey: string
): Promise<boolean> {
  try {
    const llm = createLLM({
      llmProvider: provider,
      llmModel: getDefaultModel(provider),
      [`${provider}ApiKey`]: apiKey
    });
    
    await llm.invoke([{ role: 'user', content: 'hi' }]);
    return true;
  } catch {
    return false;
  }
}

function getDefaultModel(provider: string): string {
  const defaults = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-flash'
  };
  return defaults[provider];
}
```

---

## Comando /config

Permite cambiar provider en runtime:

```
You: /config

¿Qué querés configurar?
  ❯ Cambiar LLM provider
    Cambiar modelo
    Actualizar API keys
    Ver configuración actual
```

---

## Dependencias Adicionales

```json
{
  "@langchain/anthropic": "^0.3.x",
  "@langchain/google-genai": "^0.1.x"
}
```
