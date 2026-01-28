# Nodes Module

This module contains the core executable nodes of the LangGraph workflow. Each node represents a distinct step in the agent's reasoning process.

## Architecture

The graph consists of three primary nodes:

1.  **Router Node** (`router.node.ts`):
    *   **Responsibility**: Decides whether the user's query requires external tools or can be answered directly.
    *   **Logic**: Uses an LLM with structured output to analyze the intent.
    *   **Output**: Returns `needsTools` boolean and a list of `selectedTools`.

2.  **Tool Executor Node** (`tool-executor.node.ts`):
    *   **Responsibility**: Executes the selected tools in parallel.
    *   **Logic**: Maps tool names to tool instances and invokes them with provided arguments.
    *   **Safety**: Catches errors per tool to prevent graph crash.
    *   **Output**: Updates state with `toolResults`.

3.  **Generator Node** (`generator.node.ts`):
    *   **Responsibility**: Synthesizes the final response.
    *   **Logic**: Receives tool results (if any) and original messages to generate a helpful answer.
    *   **Output**: Appends an `AIMessage` to the conversation history.

## Flow

`START` -> `Router` -> (Conditional) -> `Tool Executor` -> `Generator` -> `END`
                  ╰-> `Generator` -> `END`
