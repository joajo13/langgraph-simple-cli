import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { urlReaderTool } from "../../tools/url-reader.tool";

export class UrlReaderSkill extends BaseSkill {
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return !!config.openaiApiKey;
  }

  getTools(config: Config): StructuredTool[] {
    return [urlReaderTool];
  }
}
