/**
 * Logger utility for MonitoraCult
 * Provides consistent logging with environment-based filtering
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// Set log level based on environment
const getLogLevel = () => {
  if (__DEV__) {
    return LOG_LEVELS.DEBUG;
  }
  return LOG_LEVELS.ERROR; // Only errors in production
};

const shouldLog = (level) => {
  const currentLevel = getLogLevel();
  const levelPriority = {
    [LOG_LEVELS.ERROR]: 0,
    [LOG_LEVELS.WARN]: 1,
    [LOG_LEVELS.INFO]: 2,
    [LOG_LEVELS.DEBUG]: 3,
  };
  return levelPriority[level] <= levelPriority[currentLevel];
};

const formatMessage = (level, tag, message, ...args) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${tag}] ${message}`;
};

const logger = {
  error: (tag, message, ...args) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage(LOG_LEVELS.ERROR, tag, message), ...args);
    }
  },
  warn: (tag, message, ...args) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage(LOG_LEVELS.WARN, tag, message), ...args);
    }
  },
  info: (tag, message, ...args) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.log(formatMessage(LOG_LEVELS.INFO, tag, message), ...args);
    }
  },
  debug: (tag, message, ...args) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage(LOG_LEVELS.DEBUG, tag, message), ...args);
    }
  },
};

export default logger;
