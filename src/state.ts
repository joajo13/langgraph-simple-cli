import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

export const AgentState = Annotation.Root({
  // Message history
  ...MessagesAnnotation.spec,
  
  // Tools selected by router
  selectedTools: Annotation<Array<{ name: string; args: Record<string, any> }>>({
    reducer: (_, y) => y,
    default: () => []
  }),
  
  // Results from tool execution
  toolResults: Annotation<Record<string, string>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({})
  }),
  
  // Final response to user
  response: Annotation<string>({
    reducer: (_, y) => y,
    default: () => ''
  }),
  
  // Whether we need to use tools
  needsTools: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false
  })
});

export type AgentState = typeof AgentState.State;
