const log4js = require('log4js')

const logger = log4js.getLogger('arena')

log4js.configure({
  appenders: {
    console: { type: 'console' },
    //{ file: { type: 'file', filename: 'arena.log' }
  },
  categories: {
    default: {
      appenders: ['console'], level: 'debug'
      //appenders: ['file'], level: 'error'
    }
  }
})

const levels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
}

module.exports = {
  getLogger: prefix => new Logger(prefix)
}

/**
 * Logger class with custom prefix
 */
class Logger {

  constructor (prefix) {
    this.prefix = prefix
  }

  isDebugEnabled () {
    return this._isLevelEnabled(levels.debug)
  }

  isInfoEnabled () {
    return this._isLevelEnabled(levels.info)
  }

  isWarnEnabled () {
    return this._isLevelEnabled(levels.warn)
  }

  isErrorEnabled () {
    return this._isLevelEnabled(levels.error)
  }

  debug (msg) {
    this._log(levels.debug, msg)
  }

  info (msg) {
    this._log(levels.info, msg)
  }

  warn (msg) {
    this._log(levels.warn, msg)
  }

  error (msg) {
    this._log(levels.error, msg)
  }

  _isLevelEnabled (level) {
    return logger.isLevelEnabled(level)
  }

  _log (level, msg) {
    this._isLevelEnabled(level) && logger.log(level, `${this.prefix} - ${msg}`)
  }
}