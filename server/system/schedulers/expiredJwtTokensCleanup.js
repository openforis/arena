import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

import * as AuthService from '@server/modules/auth/service/authService'

export const init = () => {
  const logger = Log.getLogger('ExpiredJwtTokensCleanup')

  schedule.scheduleJob('0 1 * * *', async () => {
    try {
      logger.info('Deleting expired jwt tokens from the token blacklist')

      const timeSeconds = Math.floor(new Date().getTime() / 1000)

      // Give one hour margin
      const deleted = await AuthService.deleteExpiredJwtTokens(
        timeSeconds - 60 * 60,
      )
      logger.debug(`${deleted.length} expired jwt tokens deleted`)
    } catch (error) {
      logger.error(`Error deleting expired jwt tokens: ${error.toString()}`)
    }
  })
}
