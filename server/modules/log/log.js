const log4js = require('log4js')

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

const getLogger = () => log4js.getLogger('arena')

module.exports = {
  debug: message => getLogger().debug(message),
  info: message => getLogger().info(message),
  error: message => getLogger().error(message),
}