import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as SurveyService from '@server/modules/survey/service/surveyService'

const Logger = Log.getLogger('TemporarySurveysCleanup')

const lockName = 'scheduler-temporary-surveys-cleanup'
const items = 'stale temporary surveys'
const task = `deleting ${items}`

// all the temporary surveys, or only the ones created more than 24 hours ago
const deleteTemporarySurveys = async (olderThan24Hours = false): Promise<void> => {
  try {
    await runWithClusterLock({
      lockName,
      fn: async () => {
        Logger.debug(task)

        const count = await SurveyService.deleteTemporarySurveys({ olderThan24Hours })

        Logger.debug(`${count} ${items} deleted`)
      },
    })
  } catch (error) {
    Logger.error(`Error ${task}: ${error.toString()}`)
  }
}

export const init = async (): Promise<void> => {
  await deleteTemporarySurveys()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => deleteTemporarySurveys(true))
}
