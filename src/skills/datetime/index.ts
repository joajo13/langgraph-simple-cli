import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { datetimeTool } from "../../tools/datetime.tool";

export class DateTimeSkill extends BaseSkill {
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return true;
  }

  getTools(config: Config): StructuredTool[] {
    return [datetimeTool];
  }
}
