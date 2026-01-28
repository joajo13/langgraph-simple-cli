# Research Assistant 🔬

> **Enterprise Edition**: Fully Refactored, Strictly Typed, and Documented.

A multi-LLM research assistant built with **LangGraph**, featuring parallel tool execution, strict validation, and robust error handling.

## Features

- 🤖 **Multi-LLM Support**: OpenAI, Anthropic, Google Gemini.
- 🔧 **5 Powerful Tools**: Calculator, DateTime, Wikipedia, Web Search, URL Reader.
- ⚡ **Parallel Execution**: Tools run in parallel for maximum efficiency.
- 🛡️ **Enterprise Grade**:
    - **Strict Typing**: Full TypeScript coverage with Zod validation.
    - **Clean Architecture**: Modular structure with Dependency Injection.
    - **Robust Logging**: Centralized logging system.
- ⚙️ **Flexible Config**: Support for `.env` files and interactive wizard.

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

You can configure the app using Environment Variables or the Setup Wizard.

**Option A: Environment Variables (Recommended)**

Create a `.env` file in the root:

```env
# Provider Selection
LLM_PROVIDER=openai # openai | anthropic | google
LLM_MODEL=gpt-4o-mini

# API Keys
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-...
# GOOGLE_API_KEY=...
# TAVILY_API_KEY=tvly-... (Optional, for Web Search)
```

**Option B: Setup Wizard**

Run the app without variables, and it will prompt you interactively.

### 3. Run

```bash
# Development
npm run dev

# Production Build
npm run build
npm start
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for a deep dive into the internal design.

## Documentation

- [Nodes & Logic](src/nodes/README.md)
- [Tools System](src/tools/README.md)
- [LLM Factory](src/llm/README.md)
- [Configuration](src/config/README.md)

## License

MIT
# langgraph-simple-cli
