const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const SurveyManager = require('../../manager/surveyManager')

const findDeletedCycleKeys = async (surveyId, tx) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, tx)
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isPublished(surveyInfo)) {
    const surveyPrev = await SurveyManager.fetchSurveyById(surveyId, false, false, tx)
    const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
    return R.difference(Survey.getCycleKeys(surveyInfoPrev), Survey.getCycleKeys(surveyInfo))
  } else {
    return []
  }
}

module.exports = {
  findDeletedCycleKeys
}