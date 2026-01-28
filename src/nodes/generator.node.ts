import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { AgentState } from '../state';

/**
 * Creates a Generator node that synthesizes tool results into a final response.
 * 
 * @param llm - The Language Model to use for generation.
 * @returns A state update function.
 */
export function createGeneratorNode(llm: BaseChatModel) {
  const systemPrompt = `You are a helpful simple assistant. You help users find information, make calculations, and answer questions.

When you have tool results, synthesize them into a clear, helpful response. Always:
1. Be concise but complete
2. Cite sources when available
3. If multiple tools were used, combine the information coherently
4. Use natural, conversational language
5. Respond in the same language as the user's query

If no tools were used, this is a casual conversation - respond naturally and helpfully.`;

  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const hasToolResults = Object.keys(state.toolResults).length > 0;
    
    let messages = [
      { role: 'system' as const, content: systemPrompt },
      ...state.messages
    ];
    
    if (hasToolResults) {
      const toolResultsText = Object.entries(state.toolResults)
        .map(([key, value]) => `[${key}]: ${value}`)
        .join('\n\n');
      
      messages.push({
        role: 'system' as const,
        content: `Tool Results:\n${toolResultsText}\n\nUse these results to answer the user's question.`
      });
    }
    
    const response = await llm.invoke(messages);
    const responseContent = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    return {
      response: responseContent,
      messages: [...state.messages, new AIMessage(responseContent)]
    };
  };
}
