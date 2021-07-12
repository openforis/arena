import * as schedule from 'node-schedule'

import * as Log from '@server/log/log'

import * as SurveyService from '@server/modules/survey/service/surveyService'

const Logger = Log.getLogger('TemporarySurveysCleanup')

const items = 'stale temporary surveys'
const task = `deleting ${items}`

const deleteTemporarySurveys = async (olderThan24Hours = false) => {
  try {
    Logger.debug(task)

    const count = await SurveyService.deleteTemporarySurveys(olderThan24Hours)

    Logger.debug(`${count} ${items} deleted`)
  } catch (error) {
    Logger.error(`Error ${task}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteTemporarySurveys()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => deleteTemporarySurveys(true))
}
