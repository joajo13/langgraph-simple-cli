import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { createWebSearchTool } from "../../tools/web-search.tool";

export class WebSearchSkill extends BaseSkill {
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return !!config.tavilyApiKey;
  }

  getTools(config: Config): StructuredTool[] {
    const tool = createWebSearchTool(config);
    return tool ? [tool] : [];
  }
}
