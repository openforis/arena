import * as R from 'ramda'

import * as NodeDefExpression from '../nodeDefExpression'
import * as NodeDef from '../nodeDef'
import * as SurveyNodeDefs from './surveyNodeDefs'

const keys = {
  dependencyGraph: 'dependencyGraph',
}

export const dependencyTypes = {
  defaultValues: 'defaultValues',
  applicable: 'applicable',
  validations: 'validations',
}

const _getDeps = (type, nodeDefUuid) => R.pathOr([], [type, nodeDefUuid])

const _addDep = (type, nodeDefUuid, nodeDefDepUuid) => graph => {
  const dep = R.pipe(
    _getDeps(type, nodeDefUuid),
    R.append(nodeDefDepUuid),
  )(graph)
  return R.assocPath([type, nodeDefUuid], dep)(graph)
}

const addDeps = (survey, nodeDef, type, expressions) => graph => {
  const refNames = NodeDefExpression.findReferencedNodeDefs(expressions)

  for (const refName of refNames) {
    const nodeDefRef = SurveyNodeDefs.getNodeDefByName(refName)(survey)
    graph = _addDep(
      type,
      NodeDef.getUuid(nodeDefRef),
      NodeDef.getUuid(nodeDef),
    )(graph)
  }

  return graph
}

// ====== CREATE
export const buildGraph = survey =>
  R.reduce(
    (graph, nodeDef) =>
      R.pipe(
        addDeps(
          survey,
          nodeDef,
          dependencyTypes.defaultValues,
          NodeDef.getDefaultValues(nodeDef),
        ),
        addDeps(
          survey,
          nodeDef,
          dependencyTypes.applicable,
          NodeDef.getApplicable(nodeDef),
        ),
        addDeps(
          survey,
          nodeDef,
          dependencyTypes.validations,
          NodeDef.getValidationExpressions(nodeDef),
        ),
      )(graph),
    {},
    SurveyNodeDefs.getNodeDefsArray(survey),
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
              R.ifElse(
                R.isEmpty,
                R.always(accDependents),
                R.concat(accDependents),
              ),
            )(graph),
          [],
        ),
        R.flatten,
        R.uniq,
      ),
      // Return dependents by dependency Type
      R.pathOr([], [dependencyType, nodeDefUuid]),
    ),
  )

/**
 * Returns true if nodeDefUuid is among the dependencies of the specified nodeDefSourceUuid.
 *
 */
export const isNodeDefDependentOn = (
  nodeDefUuid,
  nodeDefSourceUuid,
) => survey => {
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
    R.forEach(nodeDefUuidDependent => {
      if (!visitedUuids.has(nodeDefUuidDependent)) {
        stack.push(nodeDefUuidDependent)
      }
    })(dependencies)
  }

  return false
}

// UPDATE
export const assocDependencyGraph = dependencyGraph =>
  R.assoc(keys.dependencyGraph, dependencyGraph)
