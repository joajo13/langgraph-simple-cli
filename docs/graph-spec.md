# Graph Specification

## Overview

El grafo define el flujo de ejecución del agente usando LangGraph.

---

## State Definition

**Archivo**: `src/state.ts`

```typescript
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  // Historial de mensajes
  ...MessagesAnnotation.spec,
  
  // Tools seleccionadas por el router
  selectedTools: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => []
  }),
  
  // Argumentos para cada tool
  toolArgs: Annotation<Record<string, any>>({
    reducer: (x, y) => y,
    default: () => ({})
  }),
  
  // Resultados de tools ejecutadas
  toolResults: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({})
  }),
  
  // Respuesta final al usuario
  response: Annotation<string>({
    reducer: (x, y) => y,
    default: () => ""
  })
});

export type AgentState = typeof AgentState.State;
```

---

## Nodes

### 1. Router Node

**Archivo**: `src/nodes/router.node.ts`

**Responsabilidad**: Analizar el mensaje del usuario y decidir:
- Si necesita usar tools (y cuáles)
- Si puede responder directamente

**Input**: Mensaje del usuario
**Output**: `selectedTools`, `toolArgs`

```typescript
async function routerNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // LLM con structured output para decidir tools
  const decision = await llm.withStructuredOutput(RouterSchema).invoke([
    { role: "system", content: ROUTER_PROMPT },
    lastMessage
  ]);
  
  return {
    selectedTools: decision.tools,
    toolArgs: decision.args
  };
}
```

### 2. Tool Executor Node

**Archivo**: `src/nodes/tool-executor.node.ts`

**Responsabilidad**: Ejecutar las tools seleccionadas en paralelo.

**Input**: `selectedTools`, `toolArgs`
**Output**: `toolResults`

```typescript
async function toolExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
  const { selectedTools, toolArgs } = state;
  
  // Ejecutar todas las tools en paralelo
  const promises = selectedTools.map(toolName => 
    executeToolByName(toolName, toolArgs[toolName])
  );
  
  const results = await Promise.all(promises);
  
  // Mapear resultados por nombre de tool
  const toolResults = selectedTools.reduce((acc, name, i) => {
    acc[name] = results[i];
    return acc;
  }, {});
  
  return { toolResults };
}
```

### 3. Generator Node

**Archivo**: `src/nodes/generator.node.ts`

**Responsabilidad**: Sintetizar una respuesta final usando los resultados de las tools.

**Input**: `messages`, `toolResults`
**Output**: `response`, nuevo mensaje AI

```typescript
async function generatorNode(state: AgentState): Promise<Partial<AgentState>> {
  const response = await llm.invoke([
    { role: "system", content: GENERATOR_PROMPT },
    ...state.messages,
    { role: "system", content: `Tool Results: ${JSON.stringify(state.toolResults)}` }
  ]);
  
  return {
    response: response.content,
    messages: [...state.messages, response]
  };
}
```

---

## Graph Definition

**Archivo**: `src/graph.ts`

```typescript
import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState } from "./state";

export function buildGraph() {
  const workflow = new StateGraph(AgentState)
    // Nodes
    .addNode("router", routerNode)
    .addNode("toolExecutor", toolExecutorNode)
    .addNode("generator", generatorNode)
    
    // Edges
    .addEdge(START, "router")
    .addConditionalEdges(
      "router",
      (state) => state.selectedTools.length > 0 ? "tools" : "direct",
      {
        tools: "toolExecutor",
        direct: "generator"
      }
    )
    .addEdge("toolExecutor", "generator")
    .addEdge("generator", END);
  
  return workflow.compile();
}
```

---

## Flow Diagram

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌─────────────┐
│   Router    │ ← Analiza intención
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
[tools]  [direct]
   │       │
   ▼       │
┌──────────────┐    │
│ToolExecutor  │    │
│  (parallel)  │    │
└──────┬───────┘    │
       │            │
       ▼            │
   ┌───────────┐    │
   │           │◄───┘
   │ Generator │
   │           │
   └─────┬─────┘
         │
         ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

---

## Parallelization

La paralelización ocurre en `ToolExecutorNode`:

```typescript
// Ejemplo: usuario pregunta hora en Tokyo y Londres
selectedTools: ["datetime", "datetime"]
toolArgs: {
  "datetime_0": { timezone: "Asia/Tokyo" },
  "datetime_1": { timezone: "Europe/London" }
}

// Se ejecutan en paralelo con Promise.all
const results = await Promise.all([
  datetimeTool.invoke({ timezone: "Asia/Tokyo" }),
  datetimeTool.invoke({ timezone: "Europe/London" })
]);
```
