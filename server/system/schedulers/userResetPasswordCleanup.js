import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('UserResetPasswordCleanup')

import * as UserService from '@server/modules/user/service/userService'

const entriesType = 'expired user reset password entries'

const deleteExpiredItems = async () => {
  try {
    Logger.debug(`Deleting ${entriesType}`)

    const count = await UserService.deleteUserResetPasswordExpired()

    Logger.debug(`${count} ${entriesType} deleted`)
  } catch (error) {
    Logger.error(`Error deleting ${entriesType}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteExpiredItems()

  Logger.debug(`Job scheduled to be executed every 48 hours`)
  // Executes the job every 2 days (48 hours)
  schedule.scheduleJob('*/2 * *', deleteExpiredItems)
}
