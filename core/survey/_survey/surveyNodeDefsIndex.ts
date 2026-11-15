import { Objects, Surveys } from '@openforis/arena-core'
import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
// SurveyNodeDefsIndex is not exported by arena-core: derive it from the Survey type
type NodeDefsIndex = NonNullable<ArenaSurvey['nodeDefsIndex']>

// the arena-core index functions work on a survey: wrap the index alone in a survey-like object
const toSurvey = (nodeDefsIndex: NodeDefsIndex): ArenaSurvey => ({ nodeDefsIndex }) as ArenaSurvey

// ==== READ

export const getNodeDefsIndex = (survey: ArenaSurvey): NodeDefsIndex => {
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
  nodeDefsIndex: NodeDefsIndex
}): ArenaSurvey => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({
  nodeDefsIndex,
  nodeDef,
}: {
  nodeDefsIndex: NodeDefsIndex
  nodeDef: AnyNodeDef
}): NodeDefsIndex => {
  const surveyUpdated = Surveys.addNodeDefToIndex(nodeDef)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

export const updateNodeDefUuidByNameIndex = ({
  nodeDefsIndex,
  nodeDef,
  nodeDefPrevious,
}: {
  nodeDefsIndex: NodeDefsIndex
  nodeDef: AnyNodeDef
  nodeDefPrevious?: AnyNodeDef
}): NodeDefsIndex => {
  const surveyUpdated = Surveys.updateNodeDefUuidByNameIndex(nodeDef, nodeDefPrevious)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

// ==== DELETE

export const deleteNodeDefIndex = ({
  nodeDefsIndex,
  nodeDef,
}: {
  nodeDefsIndex: NodeDefsIndex
  nodeDef: AnyNodeDef
}): NodeDefsIndex => {
  const surveyUpdated = Surveys.deleteNodeDefIndex(nodeDef)(toSurvey(nodeDefsIndex))
  return getNodeDefsIndex(surveyUpdated)
}

// ==== CREATE

export const initNodeDefsIndex = (survey: ArenaSurvey): NodeDefsIndex => {
  const surveyUpdated = Surveys.buildAndAssocNodeDefsIndex(survey)
  return getNodeDefsIndex(surveyUpdated)
}

export const initAndAssocNodeDefsIndex = (survey: ArenaSurvey): ArenaSurvey =>
  Surveys.buildAndAssocNodeDefsIndex(survey)
