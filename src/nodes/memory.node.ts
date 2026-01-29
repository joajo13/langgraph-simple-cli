import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { AgentState } from '../state';
import { logger } from '../logger';
import { updateProfileField, addUserMemory } from '../tools/user-profile/profile.tools';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

const MemoryEvaluationSchema = z.object({
  shouldUpdate: z.boolean().describe('Whether the user provided new personal information or preferences that should be saved.'),
  updates: z.array(z.object({
    type: z.enum(['field', 'memory']).describe('Type of update: "field" for structured data (name, email), "memory" for unstructured facts.'),
    key: z.string().optional().describe('For "field" updates, the key to update (e.g. "name", "email").'),
    value: z.string().describe('The value to set or the memory to record.')
  })).optional().describe('List of updates to apply.')
});

/**
 * Creates a Memory node that runs in the background to learn about the user.
 * 
 * @param llm - The Language Model to use for analysis.
 * @returns A state update function.
 */
export function createMemoryNode(llm: BaseChatModel) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    try {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      const secondToLastMessage = messages[messages.length - 2];

      if (!lastMessage || !(lastMessage instanceof AIMessage) || !secondToLastMessage || !(secondToLastMessage instanceof HumanMessage)) {
         return {};
      }

      const analysisPrompt = `You are a background Memory Agent. Your goal is to silently learn about the user from their interactions.
      
      Analyze the following interaction:
      User: "${secondToLastMessage.content}"
      AI: "${lastMessage.content}"
      
      Did the user explicitly provide any personal information, preferences, or facts about themselves that should be remembered?
      
      CRITERIA:
      - Ignore request-specific details (e.g., "Summarize this file").
      - Ignore transient questions (e.g., "What is the weather?").
      - RECORD: Names, locations, job titles, technical preferences (e.g., "I use VS Code"), hobbies, etc.
      
      Return a JSON decision.
      `;

      const llmWithStructuredOutput = llm.withStructuredOutput(MemoryEvaluationSchema);
      const result = await llmWithStructuredOutput.invoke([
        { role: 'user', content: analysisPrompt }
      ]);

      if (result.shouldUpdate && result.updates && result.updates.length > 0) {
        logger.info(`[Memory Agent] Detected ${result.updates.length} updates.`);
        
        for (const update of result.updates) {
            if (update.type === 'field' && update.key) {
                const res = updateProfileField(update.key, update.value);
                logger.info(`[Memory Agent] ${res}`);
            } else if (update.type === 'memory') {
                const res = addUserMemory(update.value);
                logger.info(`[Memory Agent] ${res}`);
            }
        }
      }

      return {}; 

    } catch (error) {
      logger.error('[Memory Agent Error]:', error);
      return {};
    }
  };
}
