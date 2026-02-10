import { logger } from '../../lib/logger';

const originalEnv = process.env;

beforeEach(() => {
  jest.restoreAllMocks();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('logger', () => {
  describe('level filtering', () => {
    it('suppresses debug and info when threshold is warn', () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'warn';

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.debug('should not appear');
      logger.info('should not appear');
      logger.warn('visible warning');
      logger.error('visible error');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('allows all levels when threshold is debug', () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('suppresses debug/info/warn when threshold is error', () => {
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'error';

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.debug('nope');
      logger.info('nope');
      logger.warn('nope');
      logger.error('yes');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('production mode (structured JSON)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';
    });

    it('outputs valid JSON with required fields', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.error('something broke', { code: 500 });

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const raw = errorSpy.mock.calls[0][0];
      const parsed = JSON.parse(raw as string);

      expect(parsed).toMatchObject({
        level: 'error',
        message: 'something broke',
        service: 'portfolio-web',
        code: 500,
      });
      expect(parsed.timestamp).toBeDefined();
    });

    it('includes metadata spread into the JSON entry', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('rate limited', { userId: 'abc', remaining: 0 });

      const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string);
      expect(parsed.userId).toBe('abc');
      expect(parsed.remaining).toBe(0);
    });

    it('prevents meta from overwriting core fields', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.error('test', { level: 'debug', service: 'hacked', message: 'spoofed' });

      const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(parsed.level).toBe('error');
      expect(parsed.service).toBe('portfolio-web');
      expect(parsed.message).toBe('test');
    });
  });

  describe('development mode (human-readable)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug';
    });

    it('prefixes with level tag', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      logger.debug('hello');

      expect(debugSpy).toHaveBeenCalledWith('[DEBUG]', 'hello');
    });

    it('appends metadata object when provided', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('request', { path: '/api' });

      expect(logSpy).toHaveBeenCalledWith('[INFO]', 'request', { path: '/api' });
    });

    it('omits metadata argument when none provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('bare warning');

      expect(warnSpy).toHaveBeenCalledWith('[WARN]', 'bare warning');
    });
  });

  describe('default threshold without NEXT_PUBLIC_LOG_LEVEL', () => {
    it('uses debug in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_LOG_LEVEL;

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      logger.debug('dev debug');
      expect(debugSpy).toHaveBeenCalled();
    });

    it('uses warn in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_LOG_LEVEL;

      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.info('should be suppressed');
      logger.warn('should appear');

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
