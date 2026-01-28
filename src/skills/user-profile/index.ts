import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { createProfileTools } from "../../tools/user-profile/profile.tools";

export class UserProfileSkill extends BaseSkill {
  
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return true;
  }

  getTools(config: Config): StructuredTool[] {
    return createProfileTools();
  }
}
