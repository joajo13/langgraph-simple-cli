# Architecture Overview

## Design Principles

This project follows **Clean Architecture** and **SOLID** principles to ensure scalability and maintainability.

### 1. Hexagonal / Modular Structure
The code is organized by feature/domain modules rather than technical layers alone.
*   `src/nodes`: Core logic units of the graph.
*   `src/tools`: distinct capabilities (plugins).
*   `src/config`: Configuration domain.
*   `src/llm`: AI Provider abstraction.

### 2. Dependency Injection
Dependencies (like `Config` and `Logger`) are injected into components (Nodes, Tools) rather than being hardcoded or imported as singletons where possible (though `logger` is a singleton for convenience).
*   `RouterNode` receives `ToolsInfo`.
*   `Graph` receives `Config`.

### 3. Strict Typing
*   **No `any`**: We use `unknown` for errors.
*   **Zod Schemas**: Used for Configuration validation and Structured Outputs from LLMs.

## Data Flow

1.  **Input**: User types a message in CLI.
2.  **State**: `AgentState` object tracks messages and tool results.
3.  **Router**: Analyzes state -> Decides `tools` or `direct`.
4.  **Execution**:
    *   If `tools`: `ToolExecutor` runs tools in parallel -> Updates state.
    *   If `direct`: `Generator` synthesizes response.
5.  **Output**: Response printed to CLI.

## Key Technologies
*   **LangGraph**: State machine orchestration.
*   **LangChain**: LLM and Tool abstractions.
*   **Zod**: Validation.
*   **TypeScript**: Static analysis.
