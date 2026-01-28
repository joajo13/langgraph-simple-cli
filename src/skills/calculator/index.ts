import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { BaseSkill } from "../core/base-skill";
import { calculatorTool } from "../../tools/calculator.tool";

export class CalculatorSkill extends BaseSkill {
  constructor() {
    super(__dirname);
  }

  isAvailable(config: Config): boolean {
    return true;
  }

  getTools(config: Config): StructuredTool[] {
    return [calculatorTool];
  }
}
