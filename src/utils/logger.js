/**
 * Structured logging utility for ValidAIte
 * Provides consistent logging across the application with appropriate levels
 */

/**
 * Logger utility that only logs in development and provides structured output
 */
export const logger = {
  error: (component, operation, error, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = error?.message || error || 'Unknown error';
      console.error(`[ValidAIte:${component}] ${operation} failed:`, errorMessage, context);
    }
  },

  warn: (component, message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ValidAIte:${component}] ${message}`, context);
    }
  },

  info: (component, message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[ValidAIte:${component}] ${message}`, context);
    }
  },

  debug: (component, message, context = {}) => {
    if (process.env.NODE_ENV === 'development' && process.env.VALIDAITE_VERBOSE) {
      console.debug(`[ValidAIte:${component}] ${message}`, context);
    }
  }
};


export const createLogger = (componentName) => ({
  error: (operation, error, context) => logger.error(componentName, operation, error, context),
  warn: (message, context) => logger.warn(componentName, message, context),
  info: (message, context) => logger.info(componentName, message, context),
  debug: (message, context) => logger.debug(componentName, message, context)
});

export default logger;
