import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const onJobEnd = async ({ job, surveyId }) => {
  if (job.isSucceeded()) {
    job.logDebug(`removing 'temporary' flag from survey ${surveyId}...`)
    await SurveyManager.removeSurveyTemporaryFlag({ surveyId })
    job.logDebug(`'temporary' flag removed from survey ${surveyId}`)
  } else {
    // a job fails (and ends) as soon as an inner job fails, while its transaction is still open and holds locks on the
    // survey schema: the temporary survey is deleted without waiting, so that the transaction can end
    job.logDebug(`deleting temporary survey ${surveyId}...`)
    SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
      .then(() => job.logDebug(`survey ${surveyId} deleted!`))
      .catch((error) => job.logError(`error deleting temporary survey ${surveyId}: ${error}`))
  }
}

export const SurveyCreatorJobHelper = {
  onJobEnd,
}
