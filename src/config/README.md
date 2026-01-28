# Config Module

This module manages application configuration, validation, and persistence.

## Features

*   **Centralized Config**: `ConfigStore` acts as the single source of truth.
*   **Environment Variables**: First-class support for `.env` files (12-Factor App).
*   **Validation**: Uses **Zod** schema to ensure configuration integrity before app startup.
*   **Setup Wizard**: Interactive CLI wizard for first-time setup (generates `config.json`).

## Configuration Precedence

1.  **Environment Variables** (`.env` or system env) - *Highest Priority*
2.  **Config File** (`~/.research-assistant/config.json`) - *Fallback*

## Schema

See `src/config/schema.ts` for the full Zod definitions.

## Key Types

*   `Config`: The inferred Type from the Zod schema.
*   `LLMProvider`: Union type of supported providers.
