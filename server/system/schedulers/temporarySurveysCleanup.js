import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as SurveyService from '@server/modules/survey/service/surveyService'

const Logger = Log.getLogger('TemporarySurveysCleanup')

const lockName = 'scheduler-temporary-surveys-cleanup'
const items = 'stale temporary surveys'
const task = `deleting ${items}`

const deleteTemporarySurveys = async (olderThan24Hours = false) => {
  try {
    await runWithClusterLock({
      lockName,
      fn: async () => {
        Logger.debug(task)

        const count = await SurveyService.deleteTemporarySurveys(olderThan24Hours)

        Logger.debug(`${count} ${items} deleted`)
      },
    })
  } catch (error) {
    Logger.error(`Error ${task}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteTemporarySurveys()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => deleteTemporarySurveys(true))
}
