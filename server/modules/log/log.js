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

module.exports = {
  isDebugEnabled: () => logger.isDebugEnabled(),

  debug: message => logger.debug(message),
  info: message => logger.info(message),
  error: message => logger.error(message),
}