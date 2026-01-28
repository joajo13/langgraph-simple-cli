import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as crypto from 'crypto';
import { Renderer } from './renderer';
import { handleCommand, CommandContext } from './commands';
import { SimpleAssistant } from '../graph';
import { Config } from '../config';
import { logger } from '../logger';

/**
 * Console controller managing the REPL loop.
 */
export class Console {
  private renderer: Renderer;
  private assistant: SimpleAssistant;
  private config: Config;
  private threadId: string;
  
  constructor(config: Config) {
    this.config = config;
    this.renderer = new Renderer();
    this.assistant = new SimpleAssistant(config);
    this.threadId = crypto.randomUUID();
  }
  
  /**
   * Starts the interactive console session.
   */
  async start(): Promise<void> {
    await this.assistant.init();
    p.log.step(chalk.gray(`Session ID: ${this.threadId}`));
    
    // Enter alternate screen buffer for full-screen experience
    this.enterAlternateScreen();
    this.renderer.clear();
    this.renderer.printWelcome(this.config.llmProvider, this.config.llmModel);
    
    // Set up cleanup on exit
    this.setupExitHandlers();
    
    while (true) {
      try {
        const input = await p.text({
          message: chalk.cyan('What is on your mind?'),
          placeholder: 'Type a message or /help...',
          validate: (value) => {
            if (!value || value.length === 0) return 'Please enter a message.';
          }
        });

        if (p.isCancel(input)) {
          this.renderer.printGoodbye();
          this.exitAlternateScreen();
          process.exit(0);
        }

        const trimmedInput = (input as string).trim();
        await this.handleInput(trimmedInput);
      } catch (error: unknown) {
        console.log(chalk.red('\nSession ended.'));
        if (error instanceof Error && error.message) {
            logger.debug(`debug output: ${error.message}`);
        }
        this.exitAlternateScreen();
        process.exit(0);
      }
    }
  }
  
  /**
   * Enters the terminal's alternate screen buffer.
   */
  private enterAlternateScreen(): void {
    process.stdout.write('\x1b[?1049h');
    process.stdout.write('\x1b[H');
  }

  /**
   * Exits the terminal's alternate screen buffer and restores previous state.
   */
  private exitAlternateScreen(): void {
    process.stdout.write('\x1b[?1049l');
  }

  /**
   * Set up signal handlers to ensure we exit the alternate screen buffer cleanly.
   */
  private setupExitHandlers(): void {
    const cleanup = () => {
      this.exitAlternateScreen();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
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
        p.log.success(chalk.green(`✨ New session started (${this.threadId})`));
        return;
      }
    }
    
    // Regular chat
    const s = p.spinner();
    try {
      s.start(chalk.yellow('Thinking...'));
      
      // Add a timeout to prevent infinite hanging
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000);
      });

      const response = await Promise.race([
        this.assistant.chat(input, this.threadId),
        timeoutPromise
      ]);

      s.stop(chalk.green('Done!'));
      this.renderer.printResponse(response);

      // Check for Gmail authentication success to reload tools
      if (response && response.includes('Successfully authenticated with Gmail')) {
        logger.info('Gmail authentication detected. Reloading tools...');
        await this.updateConfig(this.config);
        p.log.success(chalk.green('🔄 System updated with Gmail capabilities.'));
      }
    } catch (error: unknown) {
      s.stop(chalk.red('Error'));
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.renderer.printError(errorMessage);
    }
  }
  
  private async updateConfig(newConfig: Config): Promise<void> {
    this.config = newConfig;
    this.assistant = new SimpleAssistant(newConfig);
    await this.assistant.init();
    this.renderer.printWelcome(newConfig.llmProvider, newConfig.llmModel);
  }
}
