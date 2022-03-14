import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEBUGGER_NAME } from './debugger_constant';
import { IDebuggerOptions } from './debugger_interface';

@Injectable()
export class DebuggerService {
  private readonly debug: boolean;

  private readonly logger: boolean;

  private readonly maxSize: string;

  private readonly maxFiles: string;

  constructor(private configService: ConfigService) {
    this.debug = this.configService.get<boolean>('app.debug');
    this.logger =
      this.configService.get<boolean>('app.debug') && this.configService.get<boolean>('app.debugger.system.active');
    this.maxSize = this.configService.get<string>('app.debugger.system.maxSize');
    this.maxFiles = this.configService.get<string>('app.debugger.system.maxFiles');
  }

  createLogger(): IDebuggerOptions {
    const configTransportDefault = new winston.transports.DailyRotateFile({
      filename: `%DATE%.log`,
      dirname: `logs/${DEBUGGER_NAME}/default`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
      level: 'info',
    });

    const configTransportError = new winston.transports.DailyRotateFile({
      filename: `%DATE%.log`,
      dirname: `logs/${DEBUGGER_NAME}/error`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
      level: 'error',
    });

    const transports = [];
    if (this.logger || this.debug) {
      transports.push(configTransportError);
      transports.push(configTransportDefault);
    }

    transports.push(
      new winston.transports.Console({
        silent: !this.logger,
      }),
    );

    const loggerOptions: IDebuggerOptions = {
      format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
      transports,
    };
    return loggerOptions;
  }
}
