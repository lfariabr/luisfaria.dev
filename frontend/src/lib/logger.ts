type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SERVICE = 'portfolio-web';

function getThreshold(): LogLevel {
  // NEXT_PUBLIC_LOG_LEVEL is available at build-time in both browser and server
  const env =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LOG_LEVEL) ||
    '';
  if (env && env in LEVEL_PRIORITY) return env as LogLevel;
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[getThreshold()];
}

const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'log' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'log',
  warn: 'warn',
  error: 'error',
};

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const isProduction =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  const method = CONSOLE_METHOD[level];

  if (isProduction) {
    // Structured JSON for log aggregation
    const entry: Record<string, unknown> = {
      ...meta,
      level,
      message,
      service: SERVICE,
      timestamp: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console[method](JSON.stringify(entry));
  } else {
    const tag = `[${level.toUpperCase()}]`;
    if (meta && Object.keys(meta).length > 0) {
      // eslint-disable-next-line no-console
      console[method](tag, message, meta);
    } else {
      // eslint-disable-next-line no-console
      console[method](tag, message);
    }
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
