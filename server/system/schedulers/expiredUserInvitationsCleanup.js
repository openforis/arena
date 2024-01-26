import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('ExpiredUserInvitationsCleanup')

import * as UserService from '@server/modules/user/service/userService'

const entriesType = 'expired user invitations'

const deleteExpiredItems = async () => {
  try {
    Logger.debug(`Deleting ${entriesType}`)

    const { deletedInvitations, deletedUsers } = await UserService.deleteExpiredInvitationsAndUsers()

    Logger.debug(`${deletedInvitations.length} ${entriesType} deleted and ${deletedUsers.length} users deleted`)
  } catch (error) {
    Logger.error(`Error deleting ${entriesType}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteExpiredItems()

  Logger.debug(`Job scheduled to be executed every 7 days at 02:00`)

  schedule.scheduleJob('0 2 */7 * *', deleteExpiredItems)
}
