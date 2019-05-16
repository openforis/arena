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

const isDebugEnabled = () => logger.isDebugEnabled()

const isInfoEnabled = () => logger.isInfoEnabled()

const isWarnEnabled = () => logger.isWarnEnabled()

const isErrorEnabled = () => logger.isErrorEnabled()

module.exports = {
  isDebugEnabled,
  isInfoEnabled,
  isWarnEnabled,
  isErrorEnabled,

  debug: msg => isDebugEnabled() && logger.debug(msg),
  info: msg => isInfoEnabled() && logger.info(msg),
  warn: msg => isWarnEnabled() && logger.warn(msg),
  error: msg => isErrorEnabled() && logger.error(msg),

  getLogger: prefix => new Logger(prefix)
}

/**
 * Logger class with custom prefix
 */
class Logger {

  constructor (prefix) {
    this.prefix = prefix
  }

  debug (msg) {
    isDebugEnabled() && logger.debug(`${this.prefix} - ${msg}`)
  }

  info (msg) {
    isInfoEnabled() && logger.info(msg)
  }

  warn (msg) {
    isWarnEnabled() && logger.warn(msg)
  }

  error (msg) {
    isErrorEnabled() && logger.error(msg)
  }
}