import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { Skill, SkillMetadata } from "./skill";

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  /**
   * Registers a new skill in the registry
   */
  register(skill: Skill) {
    const meta = skill.getMetadata();
    if (this.skills.has(meta.name)) {
      console.warn(`Skill with name ${meta.name} is already registered. Overwriting.`);
    }
    this.skills.set(meta.name, skill);
  }

  /**
   * Returns a list of all registered skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Returns metadata for all available skills
   */
  getAvailableSkillsMetadata(config: Config): SkillMetadata[] {
    return this.getAllSkills()
      .filter(s => s.isAvailable(config))
      .map(s => s.getMetadata());
  }

  /**
   * Returns all active tools from all available skills
   */
  getActiveTools(config: Config): StructuredTool[] {
    return this.getAllSkills()
      .filter(s => s.isAvailable(config))
      .flatMap(s => s.getTools(config));
  }

  /**
   * Compiles the global system instructions by aggregating instructions from all active skills
   */
  getCombinedSystemInstructions(config: Config): string {
    const instructions = this.getAllSkills()
      .filter(s => s.isAvailable(config))
      .map(s => s.getSystemInstructions?.())
      .filter((instruction): instruction is string => !!instruction);

    if (instructions.length === 0) {
      return "";
    }

    return instructions.join("\n\n");
  }

  /**
   * Returns a specific skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Returns a lightweight index of available skills
   */
  getSkillsIndex(config: Config): Array<{ name: string, description: string, icon: string }> {
    return this.getAvailableSkillsMetadata(config).map(s => ({
      name: s.name,
      description: s.description,
      icon: s.icon
    }));
  }
}

// Global registry instance
export const skillRegistry = new SkillRegistry();
