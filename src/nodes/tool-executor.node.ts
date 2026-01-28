import { DynamicStructuredTool, StructuredTool } from '@langchain/core/tools';
import { AgentState } from '../state';
import { logger } from '../logger';

/**
 * Creates a Tool Executor node that runs selected tools in parallel.
 * 
 * @param tools - Array of available tool instances.
 * @returns A state update function.
 */
export function createToolExecutorNode(tools: StructuredTool[]) {
  const toolMap = new Map<string, StructuredTool>();
  tools.forEach(tool => toolMap.set(tool.name, tool));
  
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const { selectedTools } = state;
    
    if (!selectedTools || selectedTools.length === 0) {
      return { toolResults: {} };
    }
    
    logger.info(`[ToolExecutor] Executing ${selectedTools.length} tools...`);

    // Execute all tools in parallel
    const results = await Promise.all(
      selectedTools.map(async ({ name, args }, index) => {
        const tool = toolMap.get(name);
        if (!tool) {
          logger.warn(`[ToolExecutor] Tool not found: ${name}`);
          logger.debug(`[ToolExecutor] Available tools: ${Array.from(toolMap.keys()).join(', ')}`);
          return { key: `${name}_${index}`, result: `Tool "${name}" not found` };
        }
        
        try {
          logger.info(`[ToolExecutor] Running tool: ${name}`);
          logger.debug(`[ToolExecutor] Args:`, args);
          const result = await tool.invoke(args);
          logger.info(`[ToolExecutor] Result from ${name}: ${String(result).substring(0, 200)}...`);
          return { key: `${name}_${index}`, result: String(result) };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`[ToolExecutor] Error running ${name}:`, errorMessage);
          return { key: `${name}_${index}`, result: `Error: ${errorMessage}` };
        }
      })
    );
    
    // Collect results into a record
    const toolResults: Record<string, string> = {};
    results.forEach(({ key, result }) => {
      toolResults[key] = result;
    });
    
    return { toolResults };
  };
}
