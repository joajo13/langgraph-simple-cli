import Enquirer from 'enquirer';
import chalk from 'chalk';
import * as crypto from 'crypto';
import { Renderer } from './renderer';
import { handleCommand, CommandContext } from './commands';
import { ResearchAssistant } from '../graph';
import { Config } from '../config';
import { logger } from '../logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Input } = Enquirer as any;

/**
 * Console controller managing the REPL loop.
 */
export class Console {
  private renderer: Renderer;
  private assistant: ResearchAssistant;
  private config: Config;
  private threadId: string;
  
  constructor(config: Config) {
    this.config = config;
    this.renderer = new Renderer();
    this.assistant = new ResearchAssistant(config);
    this.threadId = crypto.randomUUID();
  }
  
  /**
   * Starts the interactive console session.
   */
  async start(): Promise<void> {
    await this.assistant.init();
    this.renderer.startThinking(); // Show quick loading indicator
    this.renderer.clear();
    this.renderer.stopThinking(); // Ensure stopped before welcome
    this.renderer.printWelcome(this.config.llmProvider, this.config.llmModel);
    console.log(chalk.gray(`  Session ID: ${this.threadId}`));
    console.log();
    
    while (true) {
      try {
        const prompt = new Input({
          name: 'message',
          message: 'You'
        });

        const input: string = (await prompt.run()).trim();
        
        if (!input) {
          continue;
        }
        
        await this.handleInput(input);
      } catch (error: unknown) {
        if (error === '') {
          // Enquirer throws empty string on helper cancellation sometimes
          return;
        }
        
        console.log(chalk.red('\nSession ended.'));
        if (error instanceof Error && error.message) {
            logger.debug(`debug output: ${error.message}`);
        }
        process.exit(0);
      }
    }
  }
  
  /**
   * Process a single input line.
   * @param input - The user input.
   */
  private async handleInput(input: string): Promise<void> {
    // Check for commands
    if (input.startsWith('/')) {
      const context: CommandContext = {
        renderer: this.renderer,
        assistant: this.assistant,
        onConfigChange: (newConfig) => this.updateConfig(newConfig)
      };
      
      const handled = await handleCommand(input, context);
      if (handled) return;
      
      // Special internal command for new session
      if (input.trim() === '/new') {
        this.threadId = crypto.randomUUID();
        this.renderer.clear();
        console.log(chalk.green(`  ✨ New session started (${this.threadId})`));
        console.log();
        return;
      }
    }
    
    // Regular chat
    try {
      this.renderer.startThinking();
      
      // Add a timeout to prevent infinite hanging
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000);
      });

      const response = await Promise.race([
        this.assistant.chat(input, this.threadId),
        timeoutPromise
      ]);

      this.renderer.printResponse(response);

      // Check for Gmail authentication success to reload tools
      if (response && response.includes('Successfully authenticated with Gmail')) {
        logger.info('Gmail authentication detected. Reloading tools...');
        await this.updateConfig(this.config);
        console.log(chalk.green('   🔄 System updated with Gmail capabilities.'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.renderer.printError(errorMessage);
    } finally {
      this.renderer.stopThinking();
    }
  }
  
  private async updateConfig(newConfig: Config): Promise<void> {
    this.config = newConfig;
    this.assistant = new ResearchAssistant(newConfig);
    await this.assistant.init();
    this.renderer.printWelcome(newConfig.llmProvider, newConfig.llmModel);
  }
}
