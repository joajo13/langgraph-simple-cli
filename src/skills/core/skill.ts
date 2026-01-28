import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";

export interface SkillMetadata {
  name: string;
  description: string;
  icon: string;
  version: string;
}

export interface Skill {
  /**
   * Returns metadata about the skill
   */
  getMetadata(): SkillMetadata;

  /**
   * Determines if the skill is available/enabled given the current configuration
   */
  isAvailable(config: Config): boolean;

  /**
   * Returns the list of tools provided by this skill
   */
  getTools(config: Config): StructuredTool[];

  /**
   * Returns specific system instructions for using this skill effectively.
   * These instructions will be injected into the agent's system prompt.
   */
  getSystemInstructions?(): string;
}
