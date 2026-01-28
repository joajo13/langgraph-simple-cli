import * as fs from 'fs';
import * as path from 'path';
import { Skill } from "./core/skill";
import { logger } from "../logger";

export class SkillLoader {
  static async loadSkills(skillsDir: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    
    if (!fs.existsSync(skillsDir)) {
      logger.error(`[SkillLoader] Skills directory not found: ${skillsDir}`);
      return [];
    }

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'core' && !entry.name.startsWith('_')) {
        const skillPath = path.join(skillsDir, entry.name);
        
        try {
          // Check if index.ts or index.js exists
          const indexTs = path.join(skillPath, 'index.ts');
          const indexJs = path.join(skillPath, 'index.js');
          
          if (fs.existsSync(indexTs) || fs.existsSync(indexJs)) {
            logger.info(`[SkillLoader] Loading skill from: ${entry.name}`);
            
            // Dynamic import
            // Note: In Node environments we might need to use absolute paths or file:// URLs
            const modulePath = path.resolve(skillPath, 'index');
            const skillModule = await import(modulePath);
            
            // Expecting default export to be the Skill Class or an instance
            let SkillClass = skillModule.default;
            
            // Fallback: check for named export that matches pattern "XSkill" or just the first export that looks like a class
            if (!SkillClass) {
                 const keys = Object.keys(skillModule);
                 const skillKey = keys.find(k => k.endsWith('Skill'));
                 if (skillKey) {
                     SkillClass = skillModule[skillKey];
                 }
            }

            if (SkillClass) {
              // Instantiate if it's a class (constructor check is rough in JS/TS without strict types at runtime)
              try {
                // If it's a class constructor
                if (typeof SkillClass === 'function' && /^class\s/.test(Function.prototype.toString.call(SkillClass))) {
                    const skillInstance = new SkillClass();
                    if (this.isSkill(skillInstance)) {
                        skills.push(skillInstance);
                    } else {
                        logger.warn(`[SkillLoader] ${entry.name} default export is not a valid Skill instance.`);
                    }
                } else if (this.isSkill(SkillClass)) {
                    // It's already an instance
                    skills.push(SkillClass);
                }
              } catch (err) {
                 logger.error(`[SkillLoader] Failed to instantiate ${entry.name}`, err);
              }
            } else {
              logger.warn(`[SkillLoader] No valid export found in ${entry.name}`);
            }
          }
        } catch (error) {
          logger.error(`[SkillLoader] Error loading skill ${entry.name}`, error);
        }
      }
    }
    
    return skills;
  }

  private static isSkill(obj: any): obj is Skill {
    return obj && 
      typeof obj.getMetadata === 'function' && 
      typeof obj.getTools === 'function' && 
      typeof obj.isAvailable === 'function';
  }
}
