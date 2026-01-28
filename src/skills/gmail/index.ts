import { StructuredTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { AuthService } from "../../services/auth.service";
import { createGmailAuthTool } from "../../tools/gmail/auth_tool";
import {
  GmailCreateDraft,
  GmailGetMessage,
  GmailGetThread,
  GmailSearch,
  GmailSendMessage
} from "@langchain/community/tools/gmail";

export class GmailSkill extends BaseSkill {
  
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    // Gmail skill is essentially always "available" to check auth status
    return true;
  }

  getTools(config: Config): StructuredTool[] {
    const tools: StructuredTool[] = [];
    
    // Auth Tool
    const authService = new AuthService(config);
    tools.push(createGmailAuthTool(authService));

    // If authenticated, add other tools
    const authClient = authService.getAuthenticatedClient();
    console.log('[GmailSkill] Auth check result:', !!authClient);
    if (authClient) {
        console.log('[GmailSkill] Authenticated! Registering Gmail tools...');
        const gmailParams = {
            credentials: {
                accessToken: async () => {
                    const { token } = await authClient.getAccessToken();
                    return token || '';
                }
            }
        };

        const emailSchema = z.object({
            to: z.union([z.string(), z.array(z.string())]).describe('The email address(es) to send to.'),
            subject: z.string().describe('The subject of the email.'),
            message: z.string().optional().describe('The body of the email.'),
            body: z.string().optional().describe('Alias for message.'),
            cc: z.union([z.string(), z.array(z.string())]).optional(),
            bcc: z.union([z.string(), z.array(z.string())]).optional(),
        });

        tools.push(
            this.wrapGmailTool(
                new GmailCreateDraft(gmailParams),
                'gmail_create_draft',
                'Create a draft email. Args: to (string or array), subject (string), message (string).',
                emailSchema
            ),
            this.wrapGmailTool(
                new GmailGetMessage(gmailParams),
                'gmail_get_message',
                'Get a specific email message by ID.'
            ),
            this.wrapGmailTool(
                new GmailGetThread(gmailParams),
                'gmail_get_thread',
                'Get a specific email thread by ID.'
            ),
            this.wrapGmailTool(
                new GmailSearch(gmailParams),
                'gmail_search',
                'Search for emails using Gmail queries (e.g. "from:alice", "subject:hello").',
                z.object({
                    query: z.string().describe('The Gmail search query.')
                })
            ),
            this.wrapGmailTool(
                new GmailSendMessage(gmailParams),
                'gmail_send_message',
                'Send an email immediately. Args: to (string or array), subject (string), message (string).',
                emailSchema
            )
        );
    }

    return tools;
  }

  private wrapGmailTool(tool: StructuredTool, newName: string, description: string, customSchema?: any) {
    return new DynamicStructuredTool({
        name: newName,
        description: description,
        schema: customSchema || tool.schema,
        func: async (input: any) => {
            console.log(`[DEBUG] ${newName} input received:`, JSON.stringify(input, null, 2));

            // Normalize inputs
            if (newName === 'gmail_create_draft' || newName === 'gmail_send_message') {
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
  }
}
