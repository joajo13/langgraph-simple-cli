import * as fs from 'fs';
import * as path from 'path';
import { StructuredTool } from "@langchain/core/tools";
import { Config } from "../../config";
import { Skill, SkillMetadata } from "./skill";
import { logger } from "../../logger";

export abstract class BaseSkill implements Skill {
  protected metadata: SkillMetadata;
  protected instructions: string;

  constructor(dirname: string) {
    const skillPath = path.join(dirname, 'SKILL.md');
    const { metadata, content } = this.outputSkillFile(skillPath);
    
    // Default metadata with fallback
    this.metadata = {
      name: metadata.name || 'unknown-skill',
      description: metadata.description || '',
      icon: metadata.icon || '🧩', // Default icon if not specified
      version: metadata.version || '1.0.0'
    };
    
    this.instructions = content;
    logger.info(`[BaseSkill] Loaded skill: ${this.metadata.name}`);
  }

  getMetadata(): SkillMetadata {
    return this.metadata;
  }

  abstract isAvailable(config: Config): boolean;

  abstract getTools(config: Config): StructuredTool[];

  getSystemInstructions(): string {
    return this.instructions;
  }

  /**
   * Simple Frontmatter parser to avoid external dependencies.
   */
  private outputSkillFile(filePath: string): { metadata: any, content: string } {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`[BaseSkill] SKILL.md not found at ${filePath}`);
        return { metadata: {}, content: '' };
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Check for frontmatter
      const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (!match) {
        // No frontmatter, treat whole file as content
        return { metadata: {}, content: fileContent };
      }

      const frontmatterRaw = match[1];
      const content = match[2];
      
      const metadata = this.parseYamlSimple(frontmatterRaw);
      
      return { metadata, content: content.trim() };
    } catch (error) {
      logger.error(`[BaseSkill] Error reading SKILL.md at ${filePath}`, error);
      return { metadata: {}, content: '' };
    }
  }

  /**
   * Very basic YAML parser for key: value pairs.
   * Does not support nested objects or arrays for now, as per simple requirement.
   */
  private parseYamlSimple(yaml: string): any {
    const result: any = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        // Remove quotes if present
        result[key] = value.replace(/^['"](.*)['"]$/, '$1');
      }
    }
    
    return result;
  }
}
