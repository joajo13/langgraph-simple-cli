import { skillRegistry } from "./core/registry";
import { GmailSkill } from "./gmail";
import { WebSearchSkill } from "./web-search";
import { CalculatorSkill } from "./calculator";
import { WikipediaSkill } from "./wikipedia";
import { DateTimeSkill } from "./datetime";
import { UrlReaderSkill } from "./url-reader";

// Register all skills
skillRegistry.register(new GmailSkill());
skillRegistry.register(new WebSearchSkill());
skillRegistry.register(new CalculatorSkill());
skillRegistry.register(new WikipediaSkill());
skillRegistry.register(new DateTimeSkill());
skillRegistry.register(new UrlReaderSkill());

export { skillRegistry };
export * from "./core/skill";
export * from "./core/registry";
