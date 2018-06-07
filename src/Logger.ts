import * as util from 'util';
import * as winston from 'winston';

export class Logger {
  private static readonly LOGGER = Logger.createLogger();

  private static createLogger(): winston.LoggerInstance {
    const rval = new winston.Logger({
      level: 'debug',
      transports: [new winston.transports.Console()]
    });
    return rval;
  }

  public static error(...input: any[]): void {
    Logger.LOGGER.error(util.format.apply(null, input));
  }

  public static warn(...input: any[]): void {
    Logger.LOGGER.warn(util.format.apply(null, input));
  }

  public static info(...input: any[]): void {
    Logger.LOGGER.info(util.format.apply(null, input));
  }

  public static verbose(...input: any[]): void {
    Logger.LOGGER.verbose(util.format.apply(null, input));
  }

  public static debug(...input: any[]): void {
    Logger.LOGGER.debug(util.format.apply(null, input));
  }

  public static silly(...input: any[]): void {
    Logger.LOGGER.silly(util.format.apply(null, input));
  }
}
