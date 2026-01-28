# LLM Module

This module handles the instantiation and configuration of Large Language Models.

## Supported Providers

*   **OpenAI** (`gpt-4o`, `gpt-4o-mini`, etc.)
*   **Anthropic** (`claude-3-5-sonnet`, `claude-3-haiku`, etc.)
*   **Google Gemini** (`gemini-1.5-pro`, `gemini-1.5-flash`)

## Implementation

*   **`llm-factory.ts`**: Central factory function `createLLM(config)` that switches on the provider and returns a standard LangChain `BaseChatModel`.
*   It handles API key injection from the validated configuration.

## Usage

```typescript
import { createLLM } from './llm';
const llm = createLLM(config);
const response = await llm.invoke("Hello");
```

## Structured Output

We use `llm.withStructuredOutput(zodSchema)` for the Router node to ensure reliable JSON parsing.
