const R = require('ramda')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefExpression = require('../../common/survey/nodeDefExpression')

const keys = {
  defaultValues: 'defaultValues',
  applicable: 'applicable',
  validations: 'validations',
  calculatedValues: 'calculatedValues',
}

const getDeps = (type, nodeDefUuid) => R.pathOr([], [type, nodeDefUuid])

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
      const nodeDefRef = Survey.getNodeDefByName(refName)(survey)
      // TODO use NodeDef.getUuid
      graph = addDep(type, nodeDefRef.uuid, nodeDef.uuid)(graph)
    }
    return graph
  }
//====== CREATE
const buildGraphs = survey => {
  let graph = {}
  const nodeDefs = Survey.getNodeDefsArray(survey)

  for (const nodeDef of nodeDefs) {
    graph = addDeps(survey, nodeDef, keys.defaultValues, NodeDef.getDefaultValues(nodeDef))(graph)
    //TODO use NodeDef function
    graph = addDeps(survey, nodeDef, keys.calculatedValues, R.pathOr([], ['props', 'calculatedValues'], nodeDef))(graph)
    graph = addDeps(survey, nodeDef, keys.applicable, R.pathOr([], ['props', 'applicable'], nodeDef))(graph)
    graph = addDeps(survey, nodeDef, keys.validations, R.pathOr([], ['props', 'validations', 'expressions'], nodeDef))(graph)
  }

  return graph
}

module.exports = {
  buildGraph: buildGraphs
}