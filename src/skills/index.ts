import { skillRegistry } from "./core/registry";
import { SkillLoader } from "./loader";
import * as path from 'path';

export async function loadAndRegisterSkills(rootDir?: string) {
  // Use provided rootDir or default to current directory
  const skillsDir = rootDir || __dirname;
  const skills = await SkillLoader.loadSkills(skillsDir);
  
  for (const skill of skills) {
    skillRegistry.register(skill);
  }
  
  return skillRegistry;
}

export { skillRegistry };
export * from "./core/skill";
export * from "./core/registry";
