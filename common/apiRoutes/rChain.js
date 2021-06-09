import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = (surveyId) => `${getSurveyPath(surveyId)}/rChain`

const getRChainCyclePath = (surveyId, cycle) => `${getRChainPath(surveyId)}/cycles/${cycle}`

// chain
export const chainStatusExec = (surveyId, chainUuid) => `${getRChainPath(surveyId)}/chains/${chainUuid}/statusExec`
export const chainUserScripts = (surveyId, chainUuid) => `${getRChainPath(surveyId)}/chains/${chainUuid}/userScripts`

// step
export const stepEntityData = (surveyId, cycle, stepUuid) =>
  `${getRChainCyclePath(surveyId, cycle)}/steps/${stepUuid}/data`

// category
export const categoryItemsData = (surveyId, categoryUuid) => `${getRChainPath(surveyId)}/categories/${categoryUuid}`

// entity
export const _entityData = (surveyId, cycle, chainUuid, stepUuid) =>
  `${getRChainCyclePath(surveyId, cycle)}/entities/${stepUuid}/data`

export const entityData = (surveyId, cycle, chainUuid, entityUuid) =>
  `${getRChainCyclePath(surveyId, cycle)}/chains/${chainUuid}/entities/${entityUuid}/data`
