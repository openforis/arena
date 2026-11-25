import log4js from 'log4js'
import path from 'node:path'

import { ProcessEnv } from '@openforis/arena-server'

// same file name used by arena-server (LOG_FILE_NAME), whose poller uploads it to S3
export const LOG_FILE_NAME = 'arena.log'

export const getLogFilePath = (): string => path.join(path.resolve(ProcessEnv.logFolder), LOG_FILE_NAME)

const logger = log4js.getLogger('arena')

// Only display color for terminals:
const layout = process.stdout.isTTY ? { type: 'colored' } : { type: 'basic' }

log4js.configure({
  appenders: {
    console: { type: 'console', layout },
    // keep the file appender configured by arena-server: log4js.configure replaces the whole configuration
    file: {
      type: 'file',
      filename: getLogFilePath(),
      maxLogSize: ProcessEnv.logMaxSizeBytes,
      backups: 5,
      compress: true,
    },
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'debug',
    },
  },
})

const levels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

const _stringifyMsgs = (msgs: unknown[]): string =>
  msgs
    .map((msg) =>
      typeof msg === 'object' ? JSON.stringify(msg) : String(msg as string | number | boolean | undefined)
    )
    .join(' ')

// logger with a custom prefix
export class Logger {
  readonly prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  get debugEnabled(): boolean {
    return this._isLevelEnabled(levels.debug)
  }

  get infoEnabled(): boolean {
    return this._isLevelEnabled(levels.info)
  }

  get warnEnabled(): boolean {
    return this._isLevelEnabled(levels.warn)
  }

  get errorEnabled(): boolean {
    return this._isLevelEnabled(levels.error)
  }

  debug(...msgs: unknown[]): void {
    this._log(levels.debug, msgs)
  }

  info(...msgs: unknown[]): void {
    this._log(levels.info, msgs)
  }

  warn(...msgs: unknown[]): void {
    this._log(levels.warn, msgs)
  }

  error(...msgs: unknown[]): void {
    this._log(levels.error, msgs)
  }

  _isLevelEnabled(level: string): boolean {
    return logger.isLevelEnabled(level)
  }

  _log(level: string, msgs: unknown[]): void {
    if (this._isLevelEnabled(level)) logger.log(level, `${this.prefix} - ${_stringifyMsgs(msgs)}`)
  }
}

export const getLogger = (prefix: string): Logger => new Logger(prefix)
