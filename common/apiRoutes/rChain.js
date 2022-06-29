import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = (surveyId) => `${getSurveyPath(surveyId)}/rChain`

const getRChainCyclePath = (surveyId, cycle) => `${getRChainPath(surveyId)}/cycles/${cycle}`

// chain
export const chainStatusExec = (surveyId, chainUuid) => `${getRChainPath(surveyId)}/chains/${chainUuid}/statusExec`
export const chainUserScripts = (surveyId, chainUuid) => `${getRChainPath(surveyId)}/chains/${chainUuid}/userScripts`

// category
export const categoryItemsData = (surveyId, categoryUuid) => `${getRChainPath(surveyId)}/categories/${categoryUuid}`

// taxonomy
export const taxonomyItemsData = (surveyId, taxonomyUuid) => `${getRChainPath(surveyId)}/taxonomies/${taxonomyUuid}`

// entity
export const entityData = ({ surveyId, cycle, chainUuid, entityUuid }) =>
  `${getRChainCyclePath(surveyId, cycle)}/chains/${chainUuid}/entities/${entityUuid}/data`

export const multipleAttributeData = ({ surveyId, cycle, chainUuid, attributeDefUuid }) =>
  `${getRChainCyclePath(surveyId, cycle)}/chains/${chainUuid}/attributes/${attributeDefUuid}/data`
