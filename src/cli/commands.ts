import { Renderer } from './renderer';
import { ResearchAssistant } from '../graph';
import { reconfigureWizard, Config } from '../config';

/**
 * Context required by commands to execute.
 */
export interface CommandContext {
  renderer: Renderer;
  assistant: ResearchAssistant;
  onConfigChange: (config: Config) => void;
}

/**
 * Handles slash commands from the user input.
 * 
 * @param input - The raw input string.
 * @param context - The command context.
 * @returns Promise<boolean> - True if a command was handled, false otherwise.
 */
export async function handleCommand(
  input: string, 
  context: CommandContext
): Promise<boolean> {
  const command = input.toLowerCase().trim();
  
  switch (command) {
    case '/help':
      context.renderer.printHelp();
      return true;
    
    case '/tools':
      context.renderer.printTools(context.assistant.getToolsInfo());
      return true;
    
    case '/config':
      const newConfig = await reconfigureWizard();
      context.onConfigChange(newConfig);
      // Wait a moment for the new config to settle if needed, or just clear
      context.renderer.clear();
      return true;
    
    case '/clear':
      context.renderer.clear();
      return true;
    
    case '/exit':
    case '/quit':
      context.renderer.printGoodbye();
      process.exit(0);
    
    default:
      if (input.startsWith('/')) {
        context.renderer.printError(`Unknown command: ${input}. Type /help for available commands.`);
        return true;
      }
      return false;
  }
}
