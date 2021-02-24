import * as R from 'ramda'

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

const _addDep = (type, nodeDefUuid, nodeDefDepUuid) => (graph) =>
  R.pipe(_getDeps(type, nodeDefUuid), R.append(nodeDefDepUuid), (dep) =>
    ObjectUtils.setInPath([type, nodeDefUuid], dep)(graph)
  )(graph)

const addDeps = (survey, nodeDef, type, expressions) => (graph) => {
  const isContextParent = SurveyDependencyTypes.isContextParentByDependencyType[type]
  const selfReferenceAllowed = SurveyDependencyTypes.selfReferenceAllowedByDependencyType[type]

  const referencedNodeDefs = {}
  expressions.forEach((nodeDefExpr) => {
    try {
      Object.assign(
        referencedNodeDefs,
        NodeDefExpressionValidator.findReferencedNodeDefs({
          survey,
          nodeDef,
          exprString: NodeDefExpression.getExpression(nodeDefExpr),
          isContextParent,
          selfReferenceAllowed,
        })
      )
    } catch (e) {
      // TODO ignore it?
    }
    try {
      Object.assign(
        NodeDefExpressionValidator.findReferencedNodeDefs({
          survey,
          nodeDef,
          exprString: NodeDefExpression.getApplyIf(nodeDefExpr),
          isContextParent,
          selfReferenceAllowed,
        })
      )
    } catch (e) {
      // TODO ignore it?
    }
  })

  Object.values(referencedNodeDefs).forEach((nodeDefRef) => {
    _addDep(type, NodeDef.getUuid(nodeDefRef), NodeDef.getUuid(nodeDef))(graph)
  })

  return graph
}

// ====== CREATE
export const buildGraph = (survey) =>
  R.reduce(
    (graph, nodeDef) =>
      R.pipe(
        addDeps(
          survey,
          nodeDef,
          SurveyDependencyTypes.dependencyTypes.defaultValues,
          NodeDef.getDefaultValues(nodeDef)
        ),
        addDeps(survey, nodeDef, SurveyDependencyTypes.dependencyTypes.applicable, NodeDef.getApplicable(nodeDef)),
        addDeps(
          survey,
          nodeDef,
          SurveyDependencyTypes.dependencyTypes.validations,
          NodeDef.getValidationExpressions(nodeDef)
        )
      )(graph),
    {},
    SurveyNodeDefs.getNodeDefsArray(survey)
  )

export const getDependencyGraph = R.propOr({}, keys.dependencyGraph)

export const getNodeDefDependencies = (nodeDefUuid, dependencyType = null) =>
  R.pipe(
    getDependencyGraph,
    R.ifElse(
      R.always(R.isNil(dependencyType)),
      // Return all node def dependents
      R.pipe(
        R.values,
        R.reduce(
          (accDependents, graph) =>
            R.pipe(
              R.propOr([], nodeDefUuid),
              R.ifElse(R.isEmpty, R.always(accDependents), R.concat(accDependents))
            )(graph),
          []
        ),
        R.flatten,
        R.uniq
      ),
      // Return dependents by dependency Type
      R.pathOr([], [dependencyType, nodeDefUuid])
    )
  )

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

export const buildAndAssocDependencyGraph = (survey) =>
  R.pipe(buildGraph, (graph) => assocDependencyGraph(graph)(survey))(survey)
