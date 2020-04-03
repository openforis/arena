import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as RChainManager from '../../manager/rChainManager'

import RChain from './rChain'

export const generateScript = async (surveyId, cycle, chainUuid, serverUrl) => {
  const rChain = new RChain(surveyId, cycle, chainUuid, serverUrl)
  await rChain.init()
}

// ==== READ
export const fetchStepData = async (surveyId, cycle, stepUuid) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  const data = await RChainManager.fetchStepData(survey, cycle, stepUuid)
  return data
}

// ==== DELETE
export const { deleteNodeResults } = RChainManager
