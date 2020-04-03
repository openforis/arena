import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = (surveyId) => `${getSurveyPath(surveyId)}/rChain`

// chain
export const chainNodeResults = (surveyId, chainUuid) => `${getRChainPath(surveyId)}/chains/${chainUuid}/nodeResults`

// step
export const stepEntityData = (surveyId, stepUuid) => `${getRChainPath(surveyId)}/steps/${stepUuid}/data`

// category'
export const categoryItemsData = (surveyId, categoryUuid) => `${getRChainPath(surveyId)}/categories/${categoryUuid}`
