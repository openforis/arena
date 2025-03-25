import { getSurveyPath } from '@common/apiRoutes/survey'

const getRChainPath = ({ surveyId, chainUuid }) => `${getSurveyPath(surveyId)}/rChain/chains/${chainUuid}`

const getRChainCyclePath = ({ surveyId, chainUuid, cycle }) =>
  `${getRChainPath({ surveyId, chainUuid })}/cycles/${cycle}`

// chain
export const chainStatusExec = ({ surveyId, chainUuid }) => `${getRChainPath({ surveyId, chainUuid })}/statusExec`
export const chainUserScripts = ({ surveyId, chainUuid }) => `${getRChainPath({ surveyId, chainUuid })}/userScripts`

// category
export const categoryItemsCsv = ({ surveyId, chainUuid, categoryUuid }) =>
  `${getRChainPath({ surveyId, chainUuid })}/categories/${categoryUuid}.csv`

// taxonomy
export const taxonomyItemsData = ({ surveyId, chainUuid, taxonomyUuid }) =>
  `${getRChainPath({ surveyId, chainUuid })}/taxonomies/${taxonomyUuid}`

// entity
export const entityData = ({ surveyId, chainUuid, cycle, entityUuid }) =>
  `${getRChainCyclePath({ surveyId, chainUuid, cycle })}/entities/${entityUuid}/data`

export const multipleAttributeData = ({ surveyId, chainUuid, cycle, attributeDefUuid }) =>
  `${getRChainCyclePath({ surveyId, chainUuid, cycle })}/attributes/${attributeDefUuid}/data`
