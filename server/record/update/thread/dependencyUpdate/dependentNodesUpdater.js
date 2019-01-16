const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../../common/stringUtils')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../../common/survey/nodeDefExpression')
const Node = require('../../../../../common/record/node')

const {dependencyTypes} = require('../../../../survey/surveyDependenchyGraph')

const NodeDependencyManager = require('./nodeDependencyManager')

const RecordExprParser = require('../../../recordExprParser')

/**
 * Module responsible for updating applicable, calculated and default values
 */

const updateNodes = async (user, survey, nodes, tx) => {
  let nodesToVisit = nodes
  let allUpdatedNodes = {}
  let lastUpdatedNodes = {}

  while (!R.isEmpty(nodesToVisit)) {

    for (const node of R.values(nodesToVisit)) {

      lastUpdatedNodes = await updateNode(user, survey, node, tx)

      nodesToVisit = R.reject(
        node => R.includes(Node.getUuid(node), R.keys(allUpdatedNodes))
      )(lastUpdatedNodes)

      allUpdatedNodes = R.mergeRight(allUpdatedNodes, lastUpdatedNodes)
    }

  }

  return allUpdatedNodes
}

const updateNode = async (user, survey, node, tx) => {

  const nodesApplicability = await updateNodeExpr(survey, node, NodeDef.getApplicable, dependencyTypes.applicable, tx)
  const nodesCalculatedValues = await updateNodeExpr(survey, node, NodeDef.getCalculatedValues, dependencyTypes.calculatedValues, tx)
  const nodesDefaultValues = await updateNodeExpr(survey, node, NodeDef.getDefaultValues, dependencyTypes.defaultValues, tx)

  return R.pipe(
    R.mergeRight(nodesCalculatedValues),
    R.mergeRight(nodesDefaultValues),
  )(nodesApplicability)

  // return nodesDefaultValues
}

const updateNodeExpr = async (survey, node, getExpressionsFn, dependencyType, tx) => {

  //1. fetch dependent nodes
  const nodeDependents = await NodeDependencyManager.fetchDependentNodes(
    survey,
    node,
    dependencyType,
    tx
  )
  const isDefaultValuesExpr = dependencyType === dependencyTypes.defaultValues
  const isApplicableExpr = dependencyType === dependencyTypes.applicable

  // filter nodes to update
  const nodesToUpdate = R.pipe(
    R.append(node),
    R.filter(n => {
        const nodeDef = getNodeDef(survey, n)
        return NodeDef.isNodeDefAttribute(nodeDef) && (
          !isDefaultValuesExpr ||
          Node.isNodeValueBlank(n) ||
          Node.isDefaultValueApplied(n)
        )
      }
    )
  )(nodeDependents)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodesToUpdate.map(async node => {

      const nodeDef = getNodeDef(survey, node)
      const expressions = getExpressionsFn(nodeDef)

      if(R.isEmpty(expressions))
        return {}

      //3. get expression
      const expr = await getApplicableExpression(survey, node, expressions, tx)

      //4. eval expr
      const value = expr
        ? await RecordExprParser.evalNodeQuery(survey, node, expr, tx)
        : isApplicableExpr
          ? true : null

      //5. persist updated node value, and return updated node
      return await isApplicableExpr
        ? NodeDependencyManager.persistDependentNodeApplicable(survey, node, value, tx)
        : NodeDependencyManager.persistDependentNodeValue(survey, node, value, isDefaultValuesExpr, tx)

    })
  )

  return R.mergeAll(nodesUpdated)
}

const getApplicableExpression = async (survey, node, expressions, tx) => {
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(survey, node, applyIfExpr, tx))
      return NodeDefExpression.getExpression(expression)
  }

  return null
}

const getNodeDef = (survey, node) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  return Survey.getNodeDefByUuid(nodeDefUuid)(survey)
}

module.exports = {
  updateNodes
}