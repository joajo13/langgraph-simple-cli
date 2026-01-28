import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { AuthService } from "../../services/auth.service";
import { createCalendarTools } from "../../tools/calendar.tools";
import { logger } from "../../logger";

export class CalendarSkill extends BaseSkill {
  
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return true; // Always available to check auth
  }

  getTools(config: Config): StructuredTool[] {
    const authService = new AuthService(config);
    return createCalendarTools(authService);
  }
}
