# Simple CLI ✨

> **Agentic Ecosystem**: Fully Refactored, Strictly Typed, and Documented.

A modern, fast multi-LLM agent built with **LangGraph**, featuring a sleek persistent CLI, parallel tool execution, and robust error handling.

## Features

- 🤖 **Multi-LLM Support**: OpenAI, Anthropic, Google Gemini.
- 🔧 **Registered Capabilities**: Calculator, Gmail, Calendar, Wikipedia, Web Search, URL Reader.
- ⚡ **Parallel Execution**: Tools run in parallel for maximum efficiency.
- 🛡️ **Modern CLI**:
    - **@clack/prompts**: Beautiful and persistent UI with borders and spinners.
    - **Strict Typing**: Full TypeScript coverage with Zod validation.
    - **Clean Architecture**: Modular structure with Dependency Injection.
- ⚙️ **Flexible Config**: Support for `.env` files and an interactive wizard.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A **Google Cloud Project** (Required for Gmail and Calendar capabilities)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd langgraph-mini-project
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Google Cloud Setup (Gmail & Calendar)

To enable Gmail and Calendar features, you need to configure a Google Cloud project:

1.  **Create a Project**:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project (e.g., `langgraph-agent`).

2.  **Enable APIs**:
    - Navigate to **APIs & Services > Library**.
    - Search for and enable:
        - **Gmail API**
        - **Google Calendar API**

3.  **Configure OAuth Consent Screen**:
    - Go to **APIs & Services > OAuth consent screen**.
    - Select **External** user type.
    - Add the following scopes:
        - `https://www.googleapis.com/auth/gmail.readonly`
        - `https://www.googleapis.com/auth/gmail.compose`
        - `https://www.googleapis.com/auth/gmail.modify`
        - `https://www.googleapis.com/auth/calendar`
    - Add your email as a **Test User**.

4.  **Create Credentials**:
    - Go to **APIs & Services > Credentials**.
    - Click **Create Credentials > OAuth client ID**.
    - Application type: **Desktop app**.
    - Copy the `Client ID` and `Client Secret`.

## Configuration

You can configure the app using Environment Variables or the Setup Wizard.

### Option A: Environment Variables (Recommended)

Create a `.env` file in the root directory:

```env
# Provider Selection
LLM_PROVIDER=openai # openai | anthropic | google
LLM_MODEL=gpt-4o-mini

# API Keys
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-...
# GOOGLE_API_KEY=...
# TAVILY_API_KEY=tvly-... (Optional, for Web Search)

# Google Cloud Credentials (Gmail & Calendar)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Option B: Setup Wizard

Run the app without variables, and it will prompt you interactively.

## Usage

### Development

Run the agent in development mode with hot-reloading:

```bash
npm run dev
```

### Production

Build and run the optimized version:

```bash
npm run build
npm start
```

### Using the Agent

1.  **Authentication**: The first time you use a Google tool (Gmail or Calendar), the agent will verify if you have a valid token. If not, it will start the authentication flow.
2.  **Interact**: Type your request in the CLI. For example:
    - "Check my unread emails from John."
    - "Draft an email to support@example.com."
    - "What do I have on my calendar for tomorrow?"
    - "Schedule a meeting with Team on Friday at 3 PM."

## Architecture

See [docs/architecture.md](docs/architecture.md) for a deep dive into the internal design.

## Documentation

- [Nodes & Logic](src/nodes/README.md)
- [Tools System](src/tools/README.md)
- [LLM Factory](src/llm/README.md)
- [Configuration](src/config/README.md)
- [Gmail & Calendar Integration](docs/gmail-integration.md)

## License

MIT
