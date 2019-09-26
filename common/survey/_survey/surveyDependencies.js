const R = require('ramda')

const NodeDefExpression = require('../nodeDefExpression')
const SurveyNodeDefs = require('./surveyNodeDefs')
const NodeDef = require('../nodeDef')

const keys = {
  dependencyGraph: 'dependencyGraph'
}

const dependencyTypes = {
  defaultValues: 'defaultValues',
  applicable: 'applicable',
  validations: 'validations',
}

const addDep = (type, nodeDefUuid, nodeDefDepUuid) =>
  graph => {
    const dep = R.pipe(
      getDeps(type, nodeDefUuid),
      R.append(nodeDefDepUuid)
    )(graph)
    return R.assocPath([type, nodeDefUuid], dep)(graph)
  }

const addDeps = (survey, nodeDef, type, expressions) =>
  graph => {
    const refNames = NodeDefExpression.findReferencedNodeDefs(expressions)

    for (const refName of refNames) {
      const nodeDefRef = SurveyNodeDefs.getNodeDefByName(refName)(survey)
      graph = addDep(type, NodeDef.getUuid(nodeDefRef), NodeDef.getUuid(nodeDef))(graph)
    }
    return graph
  }

//====== CREATE
const buildGraph = survey =>
  R.reduce(
    (graph, nodeDef) => R.pipe(
      addDeps(survey, nodeDef, dependencyTypes.defaultValues, NodeDef.getDefaultValues(nodeDef)),
      addDeps(survey, nodeDef, dependencyTypes.applicable, NodeDef.getApplicable(nodeDef)),
      addDeps(survey, nodeDef, dependencyTypes.validations, NodeDef.getValidationExpressions(nodeDef))
    )(graph),
    {},
    SurveyNodeDefs.getNodeDefsArray(survey)
  )

const getDependencyGraph = R.propOr({}, keys.dependencyGraph)

const getNodeDefDependencies = (nodeDefUuid, dependencyType = null) =>
  R.ifElse(
    R.always(R.isNil(dependencyType)),
    //return all node def dependents
    R.pipe(
      R.values,
      R.reduce((accDependents, graph) =>
          R.pipe(
            R.propOr([], nodeDefUuid),
            R.ifElse(
              R.isEmpty,
              R.always(accDependents),
              R.concat(accDependents)
            )
          )(graph),
        []
      ),
      R.flatten,
      R.uniq
    ),
    //return dependents by dependency Type
    R.path([keys.dependencyGraph, dependencyType, nodeDefUuid])
  )

const getDeps = (type, nodeDefUuid) => R.pathOr([], [type, nodeDefUuid])

module.exports = {
  dependencyTypes,

  buildGraph,

  // READ
  getDependencyGraph,
  getNodeDefDependencies,

  // UPDATE
  assocDependencyGraph: dependencyGraph => R.assoc(keys.dependencyGraph, dependencyGraph)
}