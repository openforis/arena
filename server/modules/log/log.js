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

const debug = message => {
  if (isDebugEnabled())
    logger.debug(message)
}

const info = message => {
  if (isInfoEnabled())
    logger.info(message)
}

module.exports = {
  isDebugEnabled,
  isInfoEnabled,

  debug,
  info,
  error: message => logger.error(message),
}