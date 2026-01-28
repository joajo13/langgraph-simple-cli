import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { ToolInfo } from '../tools';

/**
 * Handles all terminal output formatting and display.
 * Uses chalk for colors and ora for spinners.
 */
export class Renderer {
  private spinner: Ora;
  
  constructor() {
    this.spinner = ora();
  }
  
  /**
   * Prints the application header banner.
   */
  printHeader(): void {
    console.log();
    console.log(chalk.cyan('╭──────────────────────────────────────────────╮'));
    console.log(chalk.cyan('│') + chalk.bold.white('  🔬 Research Assistant v1.0                  ') + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.gray('  Powered by LangGraph + Multi-LLM            ') + chalk.cyan('│'));
    console.log(chalk.cyan('├──────────────────────────────────────────────┤'));
    console.log(chalk.cyan('│') + chalk.gray('  Type /help for commands                     ') + chalk.cyan('│'));
    console.log(chalk.cyan('╰──────────────────────────────────────────────╯'));
    console.log();
  }
  
  /**
   * Prints the welcome message with current config info.
   * @param provider - The active LLM provider.
   * @param model - The active model name.
   */
  printWelcome(provider: string, model: string): void {
    console.log(chalk.gray(`  Using: ${provider} / ${model}`));
    console.log();
  }
  
  /**
   * Returns the formatted prompt string.
   */
  getPrompt(): string {
    return chalk.green('You: ');
  }
  
  /**
   * Starts the thinking spinner.
   */
  startThinking(): void {
    this.spinner = ora({
      text: chalk.yellow(' Thinking...'),
      spinner: 'dots'
    }).start();
  }
  
  /**
   * Stops the thinking spinner.
   */
  stopThinking(): void {
    if (this.spinner.isSpinning) {
      this.spinner.stop();
    }
  }
  
  /**
   * Prints the assistant's response.
   * @param response - The text response to display.
   */
  printResponse(response: string): void {
    this.stopThinking();
    console.log();
    console.log(chalk.blue('🤖 Assistant:'));
    console.log(chalk.white(`   ${response.split('\n').join('\n   ')}`));
    console.log();
  }
  
  /**
   * Prints an error message.
   * @param error - The error message to display.
   */
  printError(error: string): void {
    this.stopThinking();
    console.log();
    console.log(chalk.red(`❌ Error: ${error}`));
    console.log();
  }
  
  /**
   * Prints the help menu.
   */
  printHelp(): void {
    console.log();
    console.log(chalk.yellow('📖 Available Commands:'));
    console.log();
    console.log(chalk.white('   /help    ') + chalk.gray('- Show this help'));
    console.log(chalk.white('   /tools   ') + chalk.gray('- List available tools'));
    console.log(chalk.white('   /config  ') + chalk.gray('- Reconfigure API keys (Interactive)'));
    console.log(chalk.white('   /new     ') + chalk.gray('- Start new session'));
    console.log(chalk.white('   /clear   ') + chalk.gray('- Clear screen'));
    console.log(chalk.white('   /exit    ') + chalk.gray('- Exit'));
    console.log();
  }
  
  /**
   * Prints the list of available tools and their status.
   * @param tools - List of ToolInfo objects.
   */
  printTools(tools: ToolInfo[]): void {
    console.log();
    console.log(chalk.yellow('🔧 Available Tools:'));
    console.log();
    tools.forEach(tool => {
      const status = tool.available 
        ? chalk.green('✅') 
        : chalk.red('❌');
      console.log(`   ${status} ${tool.icon} ${chalk.white(tool.name.padEnd(15))} ${chalk.gray(tool.description)}`);
    });
    console.log();
  }
  
  /**
   * Prints goodbye message.
   */
  printGoodbye(): void {
    console.log();
    console.log(chalk.cyan('👋 Goodbye!'));
    console.log();
  }
  
  /**
   * Clears the console and repaints the header.
   */
  clear(): void {
    console.clear();
    this.printHeader();
  }
}
