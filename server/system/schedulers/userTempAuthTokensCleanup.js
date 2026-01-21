import * as schedule from 'node-schedule'

import { ServiceRegistry } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import { ServerServiceType } from '@openforis/arena-server'

const Logger = Log.getLogger('UserTempAuthTokensCleanup')

const items = 'expired temporary user auth tokens'
const task = `deleting ${items}`

const deleteExpiredUserTempAuthTokens = async () => {
  try {
    Logger.debug(task)

    const serviceRegistry = ServiceRegistry.getInstance()
    const userTempAuthTokenService = serviceRegistry.getService(ServerServiceType.userTempAuthToken)
    const count = await userTempAuthTokenService.cleanupExpired()
    Logger.debug(`${count} ${items} deleted`)
  } catch (error) {
    Logger.error(`Error ${task}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteExpiredUserTempAuthTokens()

  Logger.debug('Schedule job to be executed every day at 01:00')
  schedule.scheduleJob('0 1 * * *', async () => deleteExpiredUserTempAuthTokens())
}
