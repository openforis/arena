import { getSurveyPath } from '@common/apiRoutes/survey'

type SurveyId = number | string
type ChainParams = { surveyId: SurveyId; chainUuid: string }
type ChainCycleParams = ChainParams & { cycle: string }

const getRChainPath = ({ surveyId, chainUuid }: ChainParams): string =>
  `${getSurveyPath(surveyId)}/rChain/chains/${chainUuid}`

const getRChainCyclePath = ({ surveyId, chainUuid, cycle }: ChainCycleParams): string =>
  `${getRChainPath({ surveyId, chainUuid })}/cycles/${cycle}`

// chain
export const chainStatusExec = ({ surveyId, chainUuid }: ChainParams): string =>
  `${getRChainPath({ surveyId, chainUuid })}/statusExec`
export const chainUserScripts = ({ surveyId, chainUuid }: ChainParams): string =>
  `${getRChainPath({ surveyId, chainUuid })}/userScripts`

// category
export const categoryItemsCsv = ({
  surveyId,
  chainUuid,
  categoryUuid,
}: ChainParams & { categoryUuid: string }): string =>
  `${getRChainPath({ surveyId, chainUuid })}/categories/${categoryUuid}.csv`

// taxonomy
export const taxonomyItemsData = ({
  surveyId,
  chainUuid,
  taxonomyUuid,
}: ChainParams & { taxonomyUuid: string }): string =>
  `${getRChainPath({ surveyId, chainUuid })}/taxonomies/${taxonomyUuid}`

// entity
export const entityData = ({
  surveyId,
  chainUuid,
  cycle,
  entityUuid,
}: ChainCycleParams & { entityUuid: string }): string =>
  `${getRChainCyclePath({ surveyId, chainUuid, cycle })}/entities/${entityUuid}/data`

export const multipleAttributeData = ({
  surveyId,
  chainUuid,
  cycle,
  attributeDefUuid,
}: ChainCycleParams & { attributeDefUuid: string }): string =>
  `${getRChainCyclePath({ surveyId, chainUuid, cycle })}/attributes/${attributeDefUuid}/data`

// OLAP
export const olapData = ({ surveyId, chainUuid, cycle }: ChainCycleParams): string =>
  `${getRChainCyclePath({ surveyId, chainUuid, cycle })}/olap-data`
