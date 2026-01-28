import { StateGraph, END, START, MemorySaver } from '@langchain/langgraph';
import { AgentState } from './state';
import { Config } from './config';
import { createLLM } from './llm';
import { skillRegistry, loadAndRegisterSkills } from './skills'; 
import { createSkillAccessTools } from './tools/skills.tools';
import { createRouterNode, createToolExecutorNode, createGeneratorNode } from './nodes';
import { ToolInfo } from './tools';

/**
 * Builds and compiles the LangGraph workflow.
 * 
 * @param config - The application configuration.
 * @returns A compiled StateGraph ready for invocation.
 */
export async function buildGraph(config: Config) {
  const llm = createLLM(config);
  
  // Get active tools and skill access tools
  const activeSkillsTools = skillRegistry.getActiveTools(config);
  const skillAccessTools = createSkillAccessTools(skillRegistry, config);
  const allTools = [...activeSkillsTools, ...skillAccessTools];

  // Build lightweight system instructions
  const availableSkills = skillRegistry.getSkillsIndex(config);
  const skillListStr = availableSkills.map(s => `${s.icon} ${s.name}: ${s.description}`).join('\n');
  
  // Build detailed system instructions from all skills
  const detailedSkillInstructions = skillRegistry.getCombinedSystemInstructions(config);

  const systemInstructions = `You are a helpful assistant.
You have access to several specialized skills to help you with tasks.

Available Skills:
${skillListStr}

SKILL INSTRUCTIONS & RULES:
${detailedSkillInstructions}

IMPORTANT RULES:
1. Follow the specific INSTRUCTIONS & RULES provided above for each skill.
2. If you are unsure what to do, call \`list_skills\` to see all your capabilities.
3. Do NOT hallucinate tool names. Only use the ones listed in your available tools.`;
  
  // Map all tools to ToolInfo for Router
  const toolsInfo: ToolInfo[] = allTools.map(t => {
      // Try to find a skill that starts with the same name (or matches exactly)
      const relatedSkill = availableSkills.find(s => t.name.startsWith(s.name));
      
      return {
          name: t.name,
          description: t.description,
          available: true,
          icon: relatedSkill ? relatedSkill.icon : 
                t.name.includes('skill') ? '🧩' : '🛠️' 
      };
  });
  
  const routerNode = createRouterNode(llm, toolsInfo, systemInstructions);
  const toolExecutorNode = createToolExecutorNode(allTools);
  const generatorNode = createGeneratorNode(llm);
  
  const workflow = new StateGraph(AgentState)
    // Add nodes
    .addNode('router', routerNode)
    .addNode('toolExecutor', toolExecutorNode)
    .addNode('generator', generatorNode)
    
    // Entry point
    .addEdge(START, 'router')
    
    // Router decides if tools are needed
    .addConditionalEdges(
      'router',
      (state) => state.needsTools ? 'tools' : 'direct',
      {
        tools: 'toolExecutor',
        direct: 'generator'
      }
    )
    
    // After tool execution, loop back to router to decide next steps
    .addEdge('toolExecutor', 'router')
    
    // Generator ends the flow
    .addEdge('generator', END);
  
  // Initialize MemorySaver for persistence
  const checkpointer = new MemorySaver();

  return workflow.compile({ checkpointer });
}

/**
 * SimpleAssistant class acting as a facade for the graph.
 */
export class SimpleAssistant {
  private graph: Awaited<ReturnType<typeof buildGraph>> | null = null;
  private config: Config;
  
  /**
   * Initializes the Simple Assistant.
   * @param config - Configuration object.
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize the assistant by loading skills and building the graph.
   */
  async init() {
    // Load skills dynamically
    await loadAndRegisterSkills();
    this.graph = await buildGraph(this.config);
  }
  
  /**
   * Process a user message through the agentic workflow.
   * @param message - User's query.
   * @param threadId - Unique session ID for conversation persistence.
   * @returns The assistant's response.
   */
  async chat(message: string, threadId: string): Promise<string> {
    if (!this.graph) {
        throw new Error("SimpleAssistant not initialized. Call init() first.");
    }
    const result = await this.graph.invoke(
      { messages: [{ role: 'user', content: message }] },
      { configurable: { thread_id: threadId } }
    );
    
    return (result as unknown as AgentState).response;
  }
  
  /**
   * returns info about available skills/tools.
   */
  getToolsInfo() {
    return skillRegistry.getAvailableSkillsMetadata(this.config).map(s => ({
        name: s.name,
        description: s.description,
        icon: s.icon,
        available: true
    }));
  }
  
  /**
   * returns the current configuration.
   */
  getConfig() {
    return this.config;
  }
}
