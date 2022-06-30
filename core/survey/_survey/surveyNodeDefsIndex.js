import { Surveys } from '@openforis/arena-core'

// ==== READ

export const getNodeDefsIndex = (survey) => {
  const { nodeDefsIndex } = survey
  return nodeDefsIndex || {}
}

export const assocNodeDefsIndex = ({ survey, nodeDefsIndex }) => ({ ...survey, nodeDefsIndex })

// ==== UPDATE

export const addNodeDefToIndex = ({ nodeDefsIndex, nodeDef }) => {
  const surveyUpdated = Surveys.addNodeDefToIndex(nodeDef)({ nodeDefsIndex })
  return surveyUpdated.nodeDefsIndex
}

// ==== DELETE

export const deleteNodeDefIndex = ({ nodeDefsIndex, nodeDef }) => {
  const survey = { nodeDefsIndex }
  const surveyUpdated = Surveys.deleteNodeDefIndex(nodeDef)(survey)
  return surveyUpdated.nodeDefsIndex
}

// ==== CREATE

export const initNodeDefsIndex = (survey) => {
  const surveyUpdated = Surveys.buildAndAssocNodeDefsIndex(survey)
  return surveyUpdated.nodeDefsIndex
}

export const initAndAssocNodeDefsIndex = (survey) => {
  const nodeDefsIndex = initNodeDefsIndex(survey)
  return { ...survey, nodeDefsIndex }
}
