import { configExists, loadConfig, runSetupWizard } from './config';
import { Console } from './cli';
import { logger } from './logger';

/**
 * Application entry point.
 */
async function main() {
  let config;
  
  // Check if config exists or env vars are set
  // If not, run setup wizard interactively
  if (!configExists()) {
    logger.debug('Config not found, running wizard...');
    config = await runSetupWizard();
  } else {
    logger.debug('Loading config...');
    config = loadConfig();
    if (!config) {
      // Config load failed (validation error), prompt to setup again
      logger.warn('Configuration invalid or missing. Starting setup wizard...');
      config = await runSetupWizard();
    }
    logger.debug('Config loaded.');
  }
  
  if (!config) {
    logger.error('Failed to load valid configuration. Exiting.');
    process.exit(1);
  }

  // Apply configured log level
  if (config.logLevel) {
    logger.setLogLevelFromString(config.logLevel);
    logger.debug(`Log level set to ${config.logLevel}`);
  }
  
  // Start the console
  logger.debug('Initializing Console...');
  const appConsole = new Console(config);
  logger.debug('Starting Console...');
  await appConsole.start();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main }; // Export for testing if needed
