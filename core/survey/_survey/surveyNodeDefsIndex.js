import { Objects, Surveys } from '@openforis/arena-core'

// ==== READ

export const getNodeDefsIndex = (survey) => {
  const { nodeDefsIndex } = survey
  return nodeDefsIndex || {}
}

export const hasNodeDefsIndexByName = (survey) => {
  const { nodeDefUuidByName } = getNodeDefsIndex(survey)
  return Objects.isNotEmpty(nodeDefUuidByName)
}

export const assocNodeDefsIndex = ({ survey, nodeDefsIndex }) => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({ nodeDefsIndex, nodeDef }) => {
  const surveyUpdated = Surveys.addNodeDefToIndex(nodeDef)({ nodeDefsIndex })
  return getNodeDefsIndex(surveyUpdated)
}

export const updateNodeDefUuidByNameIndex = ({ nodeDefsIndex, nodeDef, nodeDefPrevious }) => {
  const surveyUpdated = Surveys.updateNodeDefUuidByNameIndex(nodeDef, nodeDefPrevious)({ nodeDefsIndex })
  return getNodeDefsIndex(surveyUpdated)
}

// ==== DELETE

export const deleteNodeDefIndex = ({ nodeDefsIndex, nodeDef }) => {
  const survey = { nodeDefsIndex }
  const surveyUpdated = Surveys.deleteNodeDefIndex(nodeDef)(survey)
  return getNodeDefsIndex(surveyUpdated)
}

// ==== CREATE

export const initNodeDefsIndex = (survey) => {
  const surveyUpdated = Surveys.buildAndAssocNodeDefsIndex(survey)
  return getNodeDefsIndex(surveyUpdated)
}

export const initAndAssocNodeDefsIndex = (survey) => Surveys.buildAndAssocNodeDefsIndex(survey)
