import * as R from 'ramda'

import { Surveys } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'

import * as NodeDefExpression from '../nodeDefExpression'
import * as NodeDefExpressionValidator from '../nodeDefExpressionValidator'
import * as NodeDef from '../nodeDef'
import * as SurveyNodeDefs from './surveyNodeDefs'
import * as SurveyDependencyTypes from './surveyDependencyTypes'

export { dependencyTypes } from './surveyDependencyTypes'

const keys = {
  dependencyGraph: 'dependencyGraph',
}

const _getDeps = (type, nodeDefUuid) => R.pathOr([], [type, nodeDefUuid])

const _addDep = (type, nodeDefUuid, nodeDefDepUuid) => (graph) => {
  const deps = _getDeps(type, nodeDefUuid)(graph)
  const depsUpdated = [...deps, nodeDefDepUuid]
  return ObjectUtils.setInPath([type, nodeDefUuid], depsUpdated)(graph)
}

const addDeps = (survey, nodeDef, type, expressions) => (graph) => {
  const isContextParent = SurveyDependencyTypes.isContextParentByDependencyType[type]
  const selfReferenceAllowed = SurveyDependencyTypes.selfReferenceAllowedByDependencyType[type]

  const findReferencedNodeDefs = ({ exprString }) => {
    try {
      return NodeDefExpressionValidator.findReferencedNodeDefs({
        survey,
        nodeDef,
        exprString,
        isContextParent,
        selfReferenceAllowed,
      })
    } catch (e) {
      // TODO ignore it?
      return {}
    }
  }
  const referencedNodeDefs = expressions.reduce(
    (referencedAcc, nodeDefExpr) => ({
      ...referencedAcc,
      ...findReferencedNodeDefs({ exprString: NodeDefExpression.getExpression(nodeDefExpr) }),
      ...findReferencedNodeDefs({ exprString: NodeDefExpression.getApplyIf(nodeDefExpr) }),
    }),
    {}
  )

  Object.values(referencedNodeDefs).forEach((nodeDefRef) => {
    _addDep(type, NodeDef.getUuid(nodeDefRef), NodeDef.getUuid(nodeDef))(graph)
  })

  return graph
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
    R.forEach((nodeDefUuidDependent) => {
      if (!visitedUuids.has(nodeDefUuidDependent)) {
        stack.push(nodeDefUuidDependent)
      }
    })(dependencies)
  }

  return false
}

// UPDATE
export const assocDependencyGraph = (dependencyGraph) => R.assoc(keys.dependencyGraph, dependencyGraph)

// ====== CREATE
export const addNodeDefDependencies = (nodeDef) => (survey) => {
  const graph = getDependencyGraph(survey)
  const graphUpdated = R.pipe(
    addDeps(survey, nodeDef, SurveyDependencyTypes.dependencyTypes.defaultValues, NodeDef.getDefaultValues(nodeDef)),
    addDeps(survey, nodeDef, SurveyDependencyTypes.dependencyTypes.applicable, NodeDef.getApplicable(nodeDef)),
    addDeps(
      survey,
      nodeDef,
      SurveyDependencyTypes.dependencyTypes.validations,
      NodeDef.getValidationExpressions(nodeDef)
    )
  )(graph)
  return assocDependencyGraph(graphUpdated)(survey)
}

export const buildGraph = (survey) => {
  // reset survey dependency graph
  let surveyUpdated = assocDependencyGraph({})(survey)
  // add dependencies for every node def
  surveyUpdated = SurveyNodeDefs.getNodeDefsArray(survey).reduce(
    (surveyUpdatedAcc, nodeDef) => addNodeDefDependencies(nodeDef)(surveyUpdatedAcc),
    surveyUpdated
  )
  return getDependencyGraph(surveyUpdated)
}

export const buildAndAssocDependencyGraph = (survey) => Surveys.buildAndAssocDependencyGraph(survey)

// DELETE
export const removeNodeDefDependencies =
  (nodeDefUuid, dependencyType = null) =>
  (survey) => {
    const dependencyGraph = getDependencyGraph(survey)
    let dependencyGraphUpdated
    if (dependencyType) {
      dependencyGraphUpdated = R.dissocPath([dependencyType, nodeDefUuid])(dependencyGraph)
    } else {
      const dependencyTypes = Object.keys(dependencyGraph)
      dependencyGraphUpdated = dependencyTypes.reduce(
        (dependencyGraphAcc, type) => R.dissocPath([type, nodeDefUuid])(dependencyGraphAcc),
        dependencyGraph
      )
    }
    return assocDependencyGraph(dependencyGraphUpdated)(survey)
  }
