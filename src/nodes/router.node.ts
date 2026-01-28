import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { AgentState } from '../state';
import { ToolInfo } from '../tools';
import { logger } from '../logger';

const ToolCallSchema = z.object({
  name: z.string().describe('Name of the tool to use'),
  args: z.string().describe('JSON string of arguments for the tool, e.g. "{\\"query\\": \\"weather\\"}"')
});

const RouterOutputSchema = z.object({
  needsTools: z.boolean().describe('Whether tools are needed to answer the query'),
  tools: z.array(ToolCallSchema).describe('List of tools to use with their arguments')
});

// Infer type for type safety
type RouterOutput = z.infer<typeof RouterOutputSchema>;

/**
 * Creates a Router node that decides whether to use tools or answer directly.
 * Uses strict structured output from the LLM.
 * 
 * @param llm - The Language Model to use for routing decisions.
 * @param availableTools - List of available tools' metadata.
 * @returns A state update function.
 */
export function createRouterNode(llm: BaseChatModel, availableTools: ToolInfo[], systemInstructions: string = "") {
  const toolDescriptions = availableTools
    .filter(t => t.available)
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  logger.info(`[Router] Initialized with tools: ${availableTools.map(t => t.name).join(', ')}`);
  
  const systemPrompt = `You are an intelligent routing agent. Your job is to decide if the user's request requires using external tools.

Available tools:
${toolDescriptions}

## SKILL INSTRUCTIONS:
${systemInstructions}

DECISION LOGIC:
1. greeting / casual chat -> needsTools: false
2. specific question requiring knowledge (weather, prices, news, facts, calculation, time) -> needsTools: TRUE
3. explicit request to "search", "calculate", "check" -> needsTools: TRUE

IMPORTANT:
- If the user asks for "weather", "news", "price", "time", "who is", "what is" -> YOU MUST USE A TOOL.

- If the user asks for "weather", "news", "price", "time", "who is", "what is" -> YOU MUST USE A TOOL.

CALENDAR TOOL SELECTION (CRITICAL):
- "mis eventos", "agenda", "my events", "qué tengo hoy", "what do I have today" -> USE 'calendar_get_events'. NEVER use web_search for this.
- "create event", "agendar", "nueva reunion" -> USE 'get_datetime' then 'calendar_create_event'.
- "edit event", "cambiar evento", "modificar" -> USE 'calendar_get_events' FIRST (to get ID), then 'calendar_update_event'.
- "delete event", "borrar evento", "eliminar", "cancelar" -> USE 'calendar_get_events' FIRST (to get ID), then 'calendar_delete_event'. DO NOT just rename the event; DELETE IT using the tool.

GMAIL TOOL SELECTION (CRITICAL):
- "read emails", "leer emails", "mis correos", "inbox", "check mail" -> USE 'gmail_search' with query like "is:unread" or "newer_than:1d". NEVER use gmail_auth for this.
- "send email", "enviar correo" -> USE 'gmail_send_message'. NEVER use gmail_auth for this.
- "connect Gmail", "authenticate", "vincular cuenta" -> USE 'gmail_auth' with action='get_url'
- User provides code starting with "4/" -> USE 'gmail_auth' with action='submit_code' and the code
- gmail_auth is ONLY for authentication. NEVER use it for reading or sending emails.

- Do not try to answer from your internal knowledge if a tool is appropriate.
- Be aggressive in using tools for any factual query.
- CRITICAL: When using email tools (e.g. 'gmail_send_message'), YOU MUST use the EXACT email addresses and content provided by the user. Do NOT use placeholders.
- IMPORTANT: Sending an email sends a NEW message. It DOES NOT send an existing draft by ID. If the user says "Send the draft", you must construct a send_message call with the same content.

CHAINING TOOLS (CRITICAL):
- If the user's request involves multiple steps (e.g. "Check time then create event"), and you have only completed the first step (e.g. "get_datetime"), YOU MUST SELECT THE NEXT TOOL (e.g. "calendar_create_event").
- Do NOT stop to report the intermediate result unless explicitly asked.
- CONTINUE until the full user request is satisfied.

OUTPUT FORMAT:
Return valid JSON matching the schema.
For 'args', provide a valid JSON STRING representation of the arguments.
Example: args: "{\\"query\\": \\"weather in San Nicolas\\"}"`;

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    try {
      const llmWithStructuredOutput = llm.withStructuredOutput(RouterOutputSchema);
      
      const result = await llmWithStructuredOutput.invoke([
        { role: 'system', content: systemPrompt },
        ...state.messages
      ]) as RouterOutput;
      
      // Validation: If needsTools is true but no tools are listed, force false
      if (result.needsTools && (!result.tools || result.tools.length === 0)) {
        logger.warn('[Router] Logic mismatch: needsTools=true but tools list is empty. Fallback to direct.');
        return { needsTools: false, selectedTools: [] };
      }

      const selectedTools = (result.tools || []).map(t => {
        let parsedArgs = {};
        
        // Handle empty or whitespace-only args string
        const rawArgs = t.args?.trim();
        
        if (rawArgs && rawArgs !== "" && rawArgs !== "{}") {
          try {
            parsedArgs = JSON.parse(rawArgs);
          } catch (e) {
            logger.error(`[Router] Error parsing args JSON for tool ${t.name}. Raw value: "${rawArgs}"`);
            // We keep parsedArgs as {} if parsing fails
          }
        }
        
        return {
          name: t.name,
          args: parsedArgs
        };
      });
      
      return {
        needsTools: result.needsTools,
        selectedTools
      };
    } catch (error: unknown) {
      logger.error('[Router Error]:', error);
      // Fallback if structured output fails
      return {
        needsTools: false,
        selectedTools: []
      };
    }
  };
}
