import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import { Surveys } from '@openforis/arena-core'

export { dependencyTypes } from './surveyDependencyTypes'

const keys = {
  dependencyGraph: 'dependencyGraph',
}

// READ
export const getDependencyGraph = R.propOr({}, keys.dependencyGraph)

export const hasDependencyGraph = (survey) => {
  const graph = getDependencyGraph(survey)
  return !R.isEmpty(graph)
}

export const getNodeDefDependencies =
  (nodeDefUuid, dependencyType = null) =>
  (survey) =>
    Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType })

export const getNodeDefDependentsUuids =
  (nodeDefUuid, dependencyType = null) =>
  (survey) =>
    Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType }).map(NodeDef.getUuid)

/**
 * Determines if the specified nodeDefUuid is among the dependencies of the specified nodeDefSourceUuid.
 *
 * @param {!string} nodeDefUuid - The uuid of the node definition to look for.
 * @param {!string} nodeDefSourceUuid - The uuid of the node definition to use as source of the dependency.
 * @returns {boolean} - True if the dependency if found, false otherwise.
 */
export const isNodeDefDependentOn = (nodeDefUuid, nodeDefSourceUuid) => (survey) => {
  if (nodeDefUuid === nodeDefSourceUuid) {
    return false
  }

  const stack = []
  stack.push(nodeDefSourceUuid)

  const visitedUuids = new Set()

  while (stack.length > 0) {
    const nodeDefUuidCurrent = stack.pop()

    if (nodeDefUuid === nodeDefUuidCurrent) {
      return true
    }

    visitedUuids.add(nodeDefUuidCurrent)

    const dependencies = getNodeDefDependencies(nodeDefUuidCurrent)(survey)
    R.forEach((nodeDefDependent) => {
      if (!visitedUuids.has(nodeDefDependent.uuid)) {
        stack.push(nodeDefDependent.uuid)
      }
    })(dependencies)
  }

  return false
}

// UPDATE
export const assocDependencyGraph = (dependencyGraph) => R.assoc(keys.dependencyGraph, dependencyGraph)

// ====== CREATE
export const addNodeDefDependencies = (nodeDef) => (survey) => Surveys.addNodeDefDependencies({ nodeDef, survey })

export const addNodeDefsDependencies = (nodeDefsIndexedByUuid) => (survey) =>
  Object.values(nodeDefsIndexedByUuid).reduce(
    (surveyUpdated, nodeDef) => addNodeDefDependencies(nodeDef)(surveyUpdated),
    survey
  )

export const buildGraph = (survey) => {
  const surveyUpdated = Surveys.buildAndAssocDependencyGraph(survey)
  return getDependencyGraph(surveyUpdated)
}

export const buildAndAssocDependencyGraph = (survey) => Surveys.buildAndAssocDependencyGraph(survey)

// DELETE
export const removeNodeDefDependencies =
  (nodeDefUuid, dependencyType = null) =>
  (survey) =>
    Surveys.removeNodeDefDependencies({ survey, nodeDefUuid, dependencyType })
