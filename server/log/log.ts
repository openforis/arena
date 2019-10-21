import log4js from 'log4js'

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

const _stringifyMsgs = msgs => msgs
  .map(
    msg => typeof msg === 'object'
      ? JSON.stringify(msg)
      : msg
  )
  .join(' ')

/**
 * Logger class with custom prefix
 */
export class Logger {
	public prefix: any;

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

  debug (...msgs) {
    this._log(levels.debug, msgs)
  }

  info (...msgs) {
    this._log(levels.info, msgs)
  }

  warn (...msgs) {
    this._log(levels.warn, msgs)
  }

  error (...msgs) {
    this._log(levels.error, msgs)
  }

  _isLevelEnabled (level) {
    return logger.isLevelEnabled(level)
  }

  _log (level, msgs) {
    this._isLevelEnabled(level) && logger.log(level, `${this.prefix} - ${_stringifyMsgs(msgs)}`)
  }
}

export const getLogger = (prefix) => new Logger(prefix)

export default { getLogger }
