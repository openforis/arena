const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const Node = require('../../../../common/record/node')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

const RecordDependencyManager = require('./recordDependencyManager')

const NodeRepository = require('../../../record/nodeRepository')
const RecordExprParser = require('../../../record/recordExprParser')

const ApplicableUpdater = require('./applicableUpdater')

/**
 * Module responsible for updating applicable, calculated and default values
 */

const updateDependentNodes = async (user, survey, nodes, t) => {
  let nodesToVisit = nodes
  let allUpdatedNodes = {}
  let lastUpdatedNodes = {}

  while (!R.isEmpty(nodesToVisit)) {
    lastUpdatedNodes = await updateDependentNodesInternal(user, survey, nodesToVisit, t)

    nodesToVisit = R.reject(node => R.includes(Node.getUuid(node), R.keys(allUpdatedNodes)))(lastUpdatedNodes)

    allUpdatedNodes = R.mergeRight(allUpdatedNodes, lastUpdatedNodes)
  }

  return allUpdatedNodes
}

const updateDependentNodesInternal = async (user, survey, nodes, t) => {
  const nodesArray = R.values(nodes)

  const nodesApplicability = await updateApplicability(user, survey, nodesArray, t)
  const nodesCalculatedValues = await applyCalculatedValues(user, survey, nodesArray, t)
  const nodesDefaultValues = await applyDefaultValues(user, survey, nodesArray, t)

  return R.pipe(
    R.mergeRight(nodesCalculatedValues),
    R.mergeRight(nodesDefaultValues),
  )(nodesApplicability)
}

const updateApplicability = async (user, survey, nodesArray, tx) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.applicable, tx)
  return new ApplicableUpdater(user, survey).updateNodes(R.concat(dependents, nodesArray), tx)
}

const applyCalculatedValues = async (user, survey, nodesArray, tx) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.calculatedValues, tx)

  return updateNodes(
    survey,
    R.concat(dependents, nodesArray),
    (node, nodeDef) => NodeDef.isNodeDefAttribute(nodeDef),
    NodeDef.getCalculatedValues,
    applyCalculatedValue,
    tx
  )
}

const applyCalculatedValue = async (survey, node, calculatedValueExpr, tx) => {
  const value = calculatedValueExpr
    ? await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(calculatedValueExpr), tx)
    : null

  const oldValue = Node.getNodeValue(node, null)

  return R.equals(oldValue, value)
    ? {}
    : toUuidIndexedObj([await NodeRepository.updateNode(Survey.getId(survey), Node.getUuid(node), value, {[Node.metaKeys.defaultValue]: false}, tx)])
}

const applyDefaultValues = async (user, survey, nodesArray, tx) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.defaultValues, tx)
  const calculatedValuesDependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.calculatedValues, tx)

  return updateNodes(
    survey,
    R.reduce(R.concat, [], [dependents, calculatedValuesDependents, nodesArray]),
    (node, nodeDef) => NodeDef.isNodeDefAttribute(nodeDef) && (Node.isNodeValueBlank(Node.getNodeValue(node, null)) || Node.isDefaultValueApplied(node)),
    NodeDef.getDefaultValues,
    applyDefaultValue,
    tx
  )
}

const applyDefaultValue = async (survey, node, defaultValueNodeExpr, tx) => {
  const value = defaultValueNodeExpr
    ? await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(defaultValueNodeExpr), tx)
    : null

  const oldValue = Node.getNodeValue(node, null)

  return R.equals(oldValue, value)
    ? {}
    : toUuidIndexedObj([await NodeRepository.updateNode(Survey.getId(survey), Node.getUuid(node), value, {[Node.metaKeys.defaultValue]: true}, tx)])
}

/**
 * Iterates over the nodes and applies the specified nodeUpdateFunction
 */
const updateNodes = async (survey, nodesArray, nodeFilterFunction, nodeDefExpressionsGetterFunction, nodeUpdateFunction, tx) =>
  R.mergeAll(
    await Promise.all(
      nodesArray.map(async node => {
        const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

        if (nodeFilterFunction(node, nodeDef)) {
          const expressions = nodeDefExpressionsGetterFunction(nodeDef)

          return R.isEmpty(expressions)
            ? {}
            : await evaluateApplicableExpression(survey, expressions, node, nodeUpdateFunction, tx)
        } else {
          return {}
        }
      })
    )
  )

/**
 * Iterates over the expressions and evaluates the one having an empty or verified "apply if"
 */
const evaluateApplicableExpression = async (survey, expressions, node, nodeUpdateFunction, tx) => {
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(survey, node, applyIfExpr, tx)) {
      return await nodeUpdateFunction(survey, node, expression, tx)
    }
  }
  return await nodeUpdateFunction(survey, node, null, tx)
}

module.exports = {
  updateDependentNodes
}