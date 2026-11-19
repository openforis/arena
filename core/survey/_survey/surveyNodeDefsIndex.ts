import { Objects, Surveys } from '@openforis/arena-core'
import type { ArenaNodeDef, NodeDefType, ArenaSurvey, ArenaSurveyNodeDefsIndex } from '@openforis/arena-core'

type AnyNodeDef = ArenaNodeDef<NodeDefType>

// the arena-core index functions work on a survey: wrap the index alone in a survey-like object
const toSurvey = (nodeDefsIndex: ArenaSurveyNodeDefsIndex): ArenaSurvey => ({ nodeDefsIndex }) as ArenaSurvey

// ==== READ

export const getNodeDefsIndex = (survey: ArenaSurvey): ArenaSurveyNodeDefsIndex => {
  const { nodeDefsIndex } = survey
  return nodeDefsIndex || {}
}

export const hasNodeDefsIndexByName = (survey: ArenaSurvey): boolean => {
  const { nodeDefUuidByName } = getNodeDefsIndex(survey)
  return Objects.isNotEmpty(nodeDefUuidByName)
}

export const assocNodeDefsIndex = ({
  survey,
  nodeDefsIndex,
}: {
  survey: ArenaSurvey
  nodeDefsIndex: ArenaSurveyNodeDefsIndex
}): ArenaSurvey => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({
  nodeDefsIndex,
  nodeDef,
}: {
  nodeDefsIndex: ArenaSurveyNodeDefsIndex
  nodeDef: AnyNodeDef
}): ArenaSurveyNodeDefsIndex => {
  const surveyUpdated = Surveys.addNodeDefToIndex(nodeDef)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

export const updateNodeDefUuidByNameIndex = ({
  nodeDefsIndex,
  nodeDef,
  nodeDefPrevious,
}: {
  nodeDefsIndex: ArenaSurveyNodeDefsIndex
  nodeDef: AnyNodeDef
  nodeDefPrevious?: AnyNodeDef
}): ArenaSurveyNodeDefsIndex => {
  const surveyUpdated = Surveys.updateNodeDefUuidByNameIndex(nodeDef, nodeDefPrevious)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

// ==== DELETE

export const deleteNodeDefIndex = ({
  nodeDefsIndex,
  nodeDef,
}: {
  nodeDefsIndex: ArenaSurveyNodeDefsIndex
  nodeDef: AnyNodeDef
}): ArenaSurveyNodeDefsIndex => {
  const surveyUpdated = Surveys.deleteNodeDefIndex(nodeDef)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

// ==== CREATE

export const initNodeDefsIndex = (survey: ArenaSurvey): ArenaSurveyNodeDefsIndex => {
  const surveyUpdated = Surveys.buildAndAssocNodeDefsIndex(survey)
  return getNodeDefsIndex(surveyUpdated)
}

export const initAndAssocNodeDefsIndex = (survey: ArenaSurvey): ArenaSurvey =>
  Surveys.buildAndAssocNodeDefsIndex(survey)
