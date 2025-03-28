/**
 * Custom logging utility functions
 */

/**
 * Log error messages with optional error object
 * @param message Error message to log
 * @param error Optional error object to log
 */
export const logError = (message: string, error?: unknown): void => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
};

/**
 * Log info messages
 * @param message Info message to log
 */
export const logInfo = (message: string): void => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
};

/**
 * Log warning messages
 * @param message Warning message to log
 */
export const logWarning = (message: string): void => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(message);
  }
};

/**
 * Log debug messages (only in development)
 * @param message Debug message to log
 * @param data Optional data to log
 */
export const logDebug = (message: string, data?: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(message, data);
  }
}; 