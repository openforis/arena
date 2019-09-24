const schedule = require('node-schedule')

const Log = require('../../log/log')

const AuthService = require('../../modules/auth/service/authService')

const init = () => {
  const logger = Log.getLogger('ExpiredJwtTokensCleanup')

  schedule.scheduleJob('0 1 * * *', async () => {
    try {
      logger.info('Deleting expired jwt tokens from the token blacklist')

      const timeSeconds = Math.floor(new Date().getTime() / 1000)

      // Give one hour margin
      const deleted = await AuthService.deleteExpiredJwtTokens(timeSeconds - 60 * 60)
      logger.debug(`${deleted.length} expired jwt tokens deleted`)
    } catch (err) {
      logger.error(`Error deleting expired jwt tokens: ${err.toString()}`)
    }
  })
}

module.exports = {
  init
}