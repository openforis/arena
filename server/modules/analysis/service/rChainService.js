import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RChainManager from '@server/modules/analysis/manager/rChainManager'

export const fetchStepData = async (surveyId, cycle, stepUuid) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  return await RChainManager.fetchStepData(survey, cycle, stepUuid)
}
