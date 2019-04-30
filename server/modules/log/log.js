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

const isErrorEnabled = () => logger.isErrorEnabled()

module.exports = {
  isDebugEnabled,
  isInfoEnabled,
  isErrorEnabled,

  debug: msg => isDebugEnabled() && logger.debug(msg),
  info: msg => isInfoEnabled() && logger.info(msg),
  error: msg => isErrorEnabled() && logger.error(msg),
}