import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = (surveyId) => `${getSurveyPath(surveyId)}/rChain`

// chain
export const getChainNodeResultsReset = (surveyId, chainUuid) =>
  `${getRChainPath(surveyId)}/chain/${chainUuid}/nodeResults`

// step
export const getStepEntityDataRead = (surveyId, stepUuid) => `${getRChainPath(surveyId)}/step/${stepUuid}/data`

// category'
export const getCategoryItemsDataRead = (surveyId, categoryUuid) =>
  `${getRChainPath(surveyId)}/category/${categoryUuid}`
