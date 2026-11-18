import type Job from '@server/job/job'
import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const Logger = Log.getLogger('SurveyCreatorJobHelper')

const onJobEnd = async ({ job, surveyId }: { job: Job; surveyId: number }) => {
  if (job.isSucceeded()) {
    Logger.debug(`removing 'temporary' flag from survey ${surveyId}...`)
    await SurveyManager.removeSurveyTemporaryFlag({ surveyId })
    Logger.debug(`'temporary' flag removed from survey ${surveyId}`)
  } else {
    // onEnd runs when the job transaction has ended (also when an inner job fails), so the survey schema is not locked
    Logger.debug(`deleting temporary survey ${surveyId}...`)
    await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
    Logger.debug(`survey ${surveyId} deleted!`)
  }
}

export const SurveyCreatorJobHelper = {
  onJobEnd,
}
