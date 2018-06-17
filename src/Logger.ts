import * as util from 'util';
import * as winston from 'winston';

export class Logger {
  private static readonly FORMAT = winston.format.combine(
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(
      info => `${info.timestamp} [${info.level}]: ${info.message}`
    )
  );

  private static readonly LOGGER = winston.createLogger({
    level: 'debug',
    format: Logger.FORMAT,
    transports: [new winston.transports.Console()]
  });

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
