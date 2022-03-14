import log4js from 'log4js'

const logger = log4js.getLogger('arena')

// Only display color for terminals:
const layout = process.stdout.isTTY ? { type: 'colored' } : { type: 'basic' }

log4js.configure({
  appenders: {
    console: { type: 'console', layout },
    // { file: { type: 'file', filename: 'arena.log' }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'debug',
      // Appenders: ['file'], level: 'error'
    },
  },
})

const levels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

const _stringifyMsgs = (msgs) => msgs.map((msg) => (typeof msg === 'object' ? JSON.stringify(msg) : msg)).join(' ')

/**
 * Logger class with custom prefix
 */
class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  get debugEnabled() {
    return this._isLevelEnabled(levels.debug)
  }

  get infoEnabled() {
    return this._isLevelEnabled(levels.info)
  }

  get warnEnabled() {
    return this._isLevelEnabled(levels.warn)
  }

  get errorEnabled() {
    return this._isLevelEnabled(levels.error)
  }

  debug(...msgs) {
    this._log(levels.debug, msgs)
  }

  info(...msgs) {
    this._log(levels.info, msgs)
  }

  warn(...msgs) {
    this._log(levels.warn, msgs)
  }

  error(...msgs) {
    this._log(levels.error, msgs)
  }

  _isLevelEnabled(level) {
    return logger.isLevelEnabled(level)
  }

  _log(level, msgs) {
    if (this._isLevelEnabled(level)) logger.log(level, `${this.prefix} - ${_stringifyMsgs(msgs)}`)
  }
}

export const getLogger = (prefix) => new Logger(prefix)
