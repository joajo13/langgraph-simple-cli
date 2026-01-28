import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SystemMessage, RemoveMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { AgentState } from '../state';
import { logger } from '../logger';

/**
 * Creates a Summarizer node that condenses conversation history.
 * 
 * @param llm - The Language Model to use for summarization.
 * @returns A state update function.
 */
export function createSummarizerNode(llm: BaseChatModel) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const { messages } = state;


    const humanMessages = messages.filter(m => m instanceof HumanMessage);
    const aiMessages = messages.filter(m => m instanceof AIMessage);


    if (humanMessages.length <= 5 && aiMessages.length <= 5) {
      return {};
    }

    const messagesToSummarize = messages.slice(0, -2);

    if (messagesToSummarize.length === 0) {
      return {};
    }

    logger.debug('Summarizing conversation history...');

    // Prepare prompt
    const summaryPrompt = `Distill the following conversation history into a concise summary.
Include any specialized context, user preferences, or important details found in previous summaries.
The summary will be used as context for future interactions.

Existing History:
${messagesToSummarize.map(m => `${m._getType().toUpperCase()}: ${m.content}`).join('\n')}
`;

    const summaryResponse = await llm.invoke([
       { role: 'system', content: summaryPrompt }
    ]);

    logger.debug('Conversation summary generated.');
    
    // Create new summary, preserving the "System" role or usage
    const newSummary = new SystemMessage(
        `Conversation Summary: ${typeof summaryResponse.content === 'string' ? summaryResponse.content : JSON.stringify(summaryResponse.content)}`
    );

    // Remove old messages and insert new summary
    const deleteMessages = messagesToSummarize.map(m => new RemoveMessage({ id: m.id! }));
    
    return {
       messages: [...deleteMessages, newSummary]
    };
  };
}
