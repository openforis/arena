import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('ExpiredUserInvitationsCleanup')

import * as UserService from '@server/modules/user/service/userService'

const entriesType = 'expired user invitations and surveys'

const deleteExpiredItems = async () => {
  try {
    Logger.debug(`Deleting ${entriesType}`)

    const { deletedInvitations, deletedUsers, deletedSurveyIds } =
      await UserService.deleteExpiredInvitationsUsersAndSurveys()

    Logger.debug(
      `${deletedInvitations.length} ${entriesType} deleted, ${deletedUsers.length} users deleted, ${deletedSurveyIds.length} surveys deleted`
    )
  } catch (error) {
    Logger.error(`Error deleting ${entriesType}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteExpiredItems()

  Logger.debug(`Job scheduled to be executed every 7 days at 02:00`)

  schedule.scheduleJob('0 2 */7 * *', deleteExpiredItems)
}
