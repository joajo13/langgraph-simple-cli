import { DynamicStructuredTool, StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Config } from '../config';
import { calculatorTool } from './calculator.tool';
import { datetimeTool } from './datetime.tool';
import { wikipediaTool } from './wikipedia.tool';
import { createWebSearchTool } from './web-search.tool';
import { urlReaderTool } from './url-reader.tool';
import { AuthService } from '../services/auth.service';
import { createGmailAuthTool } from './gmail/auth_tool';
import { 
  GmailCreateDraft, 
  GmailGetMessage, 
  GmailGetThread, 
  GmailSearch, 
  GmailSendMessage 
} from '@langchain/community/tools/gmail';

/**
 * Interface representing metadata for a tool.
 */
export interface ToolInfo {
  /** The unique name of the tool */
  name: string;
  /** A brief description of what the tool does */
  description: string;
  /** Whether the tool is currently available/enabled */
  available: boolean;
  /** An emoji icon representing the tool */
  icon: string;
}

/**
 * Returns a list of executable tools based on the provided configuration.
 * 
 * @param config - The application configuration object.
 * @returns An array of DynamicStructuredTool instances.
 */
export function getAvailableTools(config: Config): StructuredTool[] {
  const tools: StructuredTool[] = [
    calculatorTool,
    datetimeTool,
    wikipediaTool,
    urlReaderTool
  ];
  
  const webSearchTool = createWebSearchTool(config);
  if (webSearchTool) {
    tools.push(webSearchTool);
  }

  // Gmail Integration
  const authService = new AuthService(config);
  tools.push(createGmailAuthTool(authService));

  const authClient = authService.getAuthenticatedClient();
  if (authClient) {
    const gmailParams = {
      credentials: {
        accessToken: async () => {
          const { token } = await authClient.getAccessToken();
          return token || '';
        }
      }
    };

    // Helper to wrap generic Gmail tool and normalize schema
    const wrapGmailTool = (tool: StructuredTool, newName: string, description: string, customSchema?: any) => {
      return new DynamicStructuredTool({
        name: newName,
        description: description,
        schema: customSchema || tool.schema,
        func: async (input: any) => {
          console.log(`[DEBUG] ${newName} input received:`, JSON.stringify(input, null, 2));

          // Normalize inputs for create_draft
          if (newName === 'gmail_create_draft') {
            if (input.to && typeof input.to === 'string') {
              input.to = [input.to];
            }
            // Ensure message is present if required, or handle body alias
            if (!input.message && input.body) {
                input.message = input.body;
            }
          }
           // Normalize inputs for send_message
          if (newName === 'gmail_send_message') {
             if (input.to && typeof input.to === 'string') {
                input.to = [input.to];
             }
             if (!input.message && input.body) {
                input.message = input.body;
            }
          }

          return tool.invoke(input);
        }
      });
    };

    // Shared relaxed schema for sending/drafting
    const emailSchema = z.object({
      to: z.union([z.string(), z.array(z.string())]).describe('The email address(es) to send to.'),
      subject: z.string().describe('The subject of the email.'),
      message: z.string().optional().describe('The body of the email.'),
      body: z.string().optional().describe('Alias for message.'),
      cc: z.union([z.string(), z.array(z.string())]).optional(),
      bcc: z.union([z.string(), z.array(z.string())]).optional(),
    });

    const gmailTools = [
      wrapGmailTool(
        new GmailCreateDraft(gmailParams), 
        'gmail_create_draft', 
        'Create a draft email. Args: to (string or array), subject (string), message (string).',
        emailSchema
      ),
      wrapGmailTool(
        new GmailGetMessage(gmailParams), 
        'gmail_get_message', 
        'Get a specific email message by ID.'
      ),
      wrapGmailTool(
        new GmailGetThread(gmailParams), 
        'gmail_get_thread', 
        'Get a specific email thread by ID.'
      ),
      wrapGmailTool(
        new GmailSearch(gmailParams), 
        'gmail_search', 
        'Search for emails using Gmail queries (e.g. "from:alice", "subject:hello").',
        z.object({
            query: z.string().describe('The Gmail search query.')
        })
      ),
      wrapGmailTool(
        new GmailSendMessage(gmailParams), 
        'gmail_send_message', 
        'Send an email immediately. Args: to (string or array), subject (string), message (string).',
        emailSchema
      ),
    ];
    tools.push(...gmailTools);
  }
  
  return tools;
}

/**
 * Returns metadata about all potential tools.
 * used for generating system prompts and UI info.
 * 
 * @param config - The application configuration object.
 * @returns An array of ToolInfo objects.
 */
export function getToolsInfo(config: Config): ToolInfo[] {
  const webSearchAvailable = !!config.tavilyApiKey;
  const authService = new AuthService(config); // Lightweight check
  const gmailAvailable = authService.isAuthenticated();
  
  return [
    {
      name: 'calculator',
      description: 'Mathematical calculations',
      available: true,
      icon: '🔢'
    },
    {
      name: 'get_datetime',
      description: 'Date and time in timezones',
      available: true,
      icon: '🕐'
    },
    {
      name: 'wikipedia',
      description: 'Wikipedia search',
      available: true,
      icon: '📚'
    },
    {
      name: 'web_search',
      description: 'Web search (Tavily)',
      available: webSearchAvailable,
      icon: '🌐'
    },
    {
      name: 'url_reader',
      description: 'Read webpage content',
      available: true,
      icon: '📄'
    },
    {
      name: 'gmail_auth',
      description: 'Gmail authentication',
      available: true,
      icon: '🔐'
    },
    // Detailed Gmail tools
    {
      name: 'gmail_search',
      description: 'Search for emails using Gmail queries',
      available: gmailAvailable,
      icon: '🔍'
    },
    {
      name: 'gmail_get_message',
      description: 'Get a specific email message by ID',
      available: gmailAvailable,
      icon: '📧'
    },
    {
      name: 'gmail_get_thread',
      description: 'Get a specific email thread by ID',
      available: gmailAvailable,
      icon: '🧵'
    },
    {
      name: 'gmail_create_draft',
      description: 'Create a draft email',
      available: gmailAvailable,
      icon: '📝'
    },
    {
      name: 'gmail_send_message',
      description: 'Send an email',
      available: gmailAvailable,
      icon: '📨'
    }
  ];
}

export { calculatorTool } from './calculator.tool';
export { datetimeTool } from './datetime.tool';
export { wikipediaTool } from './wikipedia.tool';
export { createWebSearchTool } from './web-search.tool';
export { urlReaderTool } from './url-reader.tool';

