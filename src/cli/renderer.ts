import chalk from 'chalk';
import * as p from '@clack/prompts';
import { ToolInfo } from '../tools';

/**
 * Handles all terminal output formatting and display.
 * Uses @clack/prompts for modern CLI aesthetics.
 */
export class Renderer {
  
  /**
   * Prints the application header banner using @clack/prompts intro.
   */
  printHeader(): void {
    console.clear();
    p.intro(chalk.bgCyan.black(' SIMPLE CLI v1.0 '));
    p.note(
      chalk.cyan(' ⚛ Multi-LLM Agent Ecosystem ') + '\n' +
      chalk.gray(' Modern, fast, and simple LangGraph agent.')
    );
  }
  
  /**
   * Prints the welcome message with current config info.
   * @param provider - The active LLM provider.
   * @param model - The active model name.
   */
  printWelcome(provider: string, model: string): void {
    p.log.info(chalk.gray(`Connected to ${chalk.white(provider)} / ${chalk.white(model)}`));
  }
  
  /**
   * Prints the assistant's response in a nice clack box.
   * @param response - The text response to display.
   */
  printResponse(response: string): void {
    p.note(response, chalk.blue('Assistant'));
  }
  
  /**
   * Prints an error message.
   * @param error - The error message to display.
   */
  printError(error: string): void {
    p.log.error(chalk.red(error));
  }
  
  /**
   * Prints the help menu.
   */
  printHelp(): void {
    const commands = [
      { cmd: '/help', desc: 'Show this help' },
      { cmd: '/tools', desc: 'List available tools' },
      { cmd: '/config', desc: 'Reconfigure API keys' },
      { cmd: '/new', desc: 'Start new session' },
      { cmd: '/clear', desc: 'Clear screen' },
      { cmd: '/exit', desc: 'Exit' }
    ];
    
    let helpText = '';
    commands.forEach(c => {
      helpText += `${chalk.white(c.cmd.padEnd(10))} ${chalk.gray(c.desc)}\n`;
    });
    
    p.note(helpText.trim(), chalk.yellow('Available Commands'));
  }
  
  /**
   * Prints the list of available tools and their status.
   * @param tools - List of ToolInfo objects.
   */
  printTools(tools: ToolInfo[]): void {
    // Sort tools by availability
    const sortedTools = [...tools].sort((a, b) => Number(b.available) - Number(a.available));

    let toolsText = '';
    sortedTools.forEach(tool => {
      const statusIcon = tool.available ? chalk.green('●') : chalk.red('○');
      const name = tool.available ? chalk.white(tool.name) : chalk.gray(tool.name);
      const icon = tool.available ? tool.icon : '🔒';
      
      toolsText += ` ${statusIcon} ${icon.padEnd(2)} ${name.padEnd(20)} ${chalk.gray(tool.description)}\n`;
    });
    
    p.note(toolsText.trim(), chalk.yellow('Registered Capabilities'));
  }
  
  /**
   * Prints goodbye message.
   */
  printGoodbye(): void {
    p.outro(chalk.cyan('👋 Goodbye! See you soon.'));
  }
  
  /**
   * Clears the console and repaints the header.
   */
  clear(): void {
    this.printHeader();
  }
}
