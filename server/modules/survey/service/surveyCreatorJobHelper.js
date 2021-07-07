import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const onJobEnd = async ({ job, surveyId }) => {
  if (job.isSucceeded()) {
    job.logDebug(`removing 'temporary' flag from survey ${surveyId}...`)
    await SurveyManager.removeSurveyTemporaryFlag({ surveyId })
    job.logDebug(`'temporary' flag removed from survey ${surveyId}`)
  } else {
    job.logDebug(`deleting temporary survey ${surveyId}...`)
    await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
    job.logDebug(`survey ${surveyId} deleted!`)
  }
}

export const SurveyCreatorJobHelper = {
  onJobEnd,
}
