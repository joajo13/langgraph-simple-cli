# Tools Module

This module defines the external capabilities available to the agent.

## Available Tools

| Tool Name | Description | Key Features |
| :--- | :--- | :--- |
| **Calculator** | Mathematical operations | Arithmetic, Unit conversion (`mathjs`). |
| **Datetime** | Timezone information | World clock, IANA timezone support. |
| **Web Search** | Internet search | Uses Tavily API for real-time data. |
| **Wikipedia** | Knowledge base | Summaries from Wikipedia (EN/ES). |
| **URL Reader** | Web scraping | Extracts component text from URLs using Cheerio. |

## Adding a New Tool

1.  Create a new file in `src/tools/` (e.g., `my-tool.tool.ts`).
2.  Define the tool using `DynamicStructuredTool` and `zod` schema.
3.  Export it in `src/tools/index.ts`.
4.  Add it to the `getAvailableTools` and `getToolsInfo` functions.

## Error Handling

All tools must wrap their execution in a `try/catch` block and return a string describing the error, rather than throwing. This ensures the agent sees the error and can report it or retry, without crashing the process.
