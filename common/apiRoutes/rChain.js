import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = (surveyId) => `${getSurveyPath(surveyId)}/rChain`

const getRChainCyclePath = (surveyId, cycle) => `${getRChainPath(surveyId)}/cycles/${cycle}`

// chain
export const chainNodeResults = (surveyId, cycle, chainUuid) =>
  `${getRChainCyclePath(surveyId, cycle)}/chains/${chainUuid}/nodeResults`

// step
export const stepEntityData = (surveyId, cycle, stepUuid) =>
  `${getRChainCyclePath(surveyId, cycle)}/steps/${stepUuid}/data`

// category'
export const categoryItemsData = (surveyId, categoryUuid) => `${getRChainPath(surveyId)}/categories/${categoryUuid}`
