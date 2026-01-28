import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service';

export const createGmailAuthTool = (authService: AuthService) => {
  return new DynamicStructuredTool({
    name: 'gmail_auth',
    description: 'ONLY use this tool when: (1) user explicitly asks to connect/authenticate Gmail, (2) user provides an OAuth code starting with "4/", or (3) another Gmail tool fails with auth error. Do NOT use for reading or sending emails - use gmail_search or gmail_send_message instead.',
    schema: z.object({
      action: z.string()
        .optional()
        .describe('The action to perform. Defaults to "get_url". Options: "get_url", "submit_code".'),
      code: z.string().optional().describe('The authorization code provided by the user (only for "submit_code" action).'),
    }),
    func: async ({ action, code }) => {
      // safe-guard: clean up the action just in case 
      let safeAction = (action || 'get_url').toLowerCase().trim();
      
      // Handle fuzzy matching for common hallucinations
      if (safeAction === 'connect' || safeAction === 'auth' || safeAction === 'login') {
        safeAction = 'get_url';
      }

      if (safeAction === 'get_url') {
        const url = authService.getAuthUrl();
        return `Please visit this URL to authorize the application:\n\n${url}\n\nAfter authorizing, copy the code provided and paste it back here using this same tool with action="submit_code" and code="YOUR_CODE".`;
      }

      if (safeAction === 'submit_code') {
        // If code is missing here, we try to see if it was passed in "action" field by mistake or just fail meaningfully
        if (!code) {
          // Fallback: check if the 'action' itself looks like a code (long string starting with 4/)
          if (action && action.startsWith('4/')) {
             code = action;
          } else {
             return 'Error: specific "code" argument is required for submit_code action.';
          }
        }
        
        if (code) {
            const success = await authService.getTokensFromCode(code);
            if (success) {
            return 'Successfully authenticated with Gmail! You can now ask me to read or send emails.';
            } else {
            return 'Failed to authenticate. The code might be invalid or expired. Please try generating a new URL.';
            }
        }
      }

      return 'Invalid action.';
    },
  });
};
