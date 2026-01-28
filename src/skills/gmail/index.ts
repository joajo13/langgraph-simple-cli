import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { AuthService } from "../../services/auth.service";
import { createGmailAuthTool } from "../../tools/gmail/auth_tool";
import { createGmailTools } from "../../tools/gmail/gmail.tools";

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

    // other tools
    const gmailTools = createGmailTools(authService);
    tools.push(...gmailTools);

    return tools;
  }
}
