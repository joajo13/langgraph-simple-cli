import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SkillRegistry } from '../skills/core/registry';
import { Config } from '../config';

/**
 * Creates tools for the agent to access skills on-demand.
 * 
 * @param registry - The SkillRegistry instance.
 * @param config - Application configuration.
 * @returns An array of tools.
 */
export const createSkillAccessTools = (registry: SkillRegistry, config: Config) => {
  const listSkillsTool = new DynamicStructuredTool({
    name: 'list_skills',
    description: 'List all available skills (capabilities) of the assistant with brief descriptions. Use this when you are unsure what you can do.',
    schema: z.object({}),
    func: async () => {
      const skills = registry.getSkillsIndex(config);
      if (skills.length === 0) {
        return 'No skills are currently available.';
      }
      return JSON.stringify({ skills }, null, 2);
    }
  });

  const readSkillInstructionsTool = new DynamicStructuredTool({
    name: 'read_skill',
    description: 'Read the detailed instructions and rules for a specific skill. You MUST use this before using a skill for the first time or if you receive an error from a skill tool.',
    schema: z.object({
      skillName: z.string().describe('The name of the skill to read (e.g., "gmail", "web_search").')
    }),
    func: async ({ skillName }) => {
      const skill = registry.getSkill(skillName);
      if (!skill) {
        return `Error: Skill "${skillName}" not found. Use list_skills to see available skills.`;
      }
      
      if (!skill.isAvailable(config)) {
        return `Error: Skill "${skillName}" is registered but not available/enabled in the current configuration.`;
      }

      const instructions = skill.getSystemInstructions?.();
      if (!instructions) {
        return `The skill "${skillName}" exists but has no special instructions.`;
      }

      return `## Instructions for Skill: ${skillName}\n\n${instructions}`;
    }
  });

  return [listSkillsTool, readSkillInstructionsTool];
};
