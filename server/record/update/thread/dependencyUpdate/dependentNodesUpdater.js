const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../../common/stringUtils')
const Queue = require('../../../../../common/queue')

const Survey = require('../../../../../common/survey/survey')
const SurveyUtils = require('../../../../../common/survey/surveyUtils')
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
  let allUpdatedNodes = R.values(nodes)

  const nodesToVisit = new Queue(R.values(nodes))
  const visitedNodeUuids = []

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    // visit only unvisited nodes
    if (!R.includes(nodeUuid, visitedNodeUuids)) {

      // update node
      const lastUpdatedNodes = await updateNode(user, survey, node, tx)

      // mark updated nodes to visit
      const nodesUpdatedArray = R.values(lastUpdatedNodes)
      nodesToVisit.enqueueItems(nodesUpdatedArray)

      // update nodes to return
      for (const nodeUpdated of nodesUpdatedArray) {
        const idx = R.findIndex(
          R.propEq(Node.keys.uuid, Node.getUuid(nodeUpdated))
        )(allUpdatedNodes)

        idx >= 0
          ? allUpdatedNodes[idx] = R.mergeDeepRight(allUpdatedNodes[idx], nodeUpdated)
          : allUpdatedNodes.push(nodeUpdated)

      }

      // mark node visited
      visitedNodeUuids.push(nodeUuid)
    }
  }

  return SurveyUtils.toUuidIndexedObj(allUpdatedNodes)
}

const updateNode = async (user, survey, node, tx) => {

  const nodesApplicability = await updateNodeExpr(survey, node, NodeDef.getApplicable, dependencyTypes.applicable, tx)
  const nodesCalculatedValues = await updateNodeExpr(survey, node, NodeDef.getCalculatedValues, dependencyTypes.calculatedValues, tx)
  const nodesDefaultValues = await updateNodeExpr(survey, node, NodeDef.getDefaultValues, dependencyTypes.defaultValues, tx)

  return R.pipe(
    R.mergeRight(nodesCalculatedValues),
    R.mergeRight(nodesDefaultValues),
  )(nodesApplicability)
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
    R.filter(o => {
        const {nodeCtx: n, nodeDef} = o

        return isApplicableExpr || (
          NodeDef.isNodeDefAttribute(nodeDef) && (
            Node.isNodeValueBlank(n) ||
            Node.isDefaultValueApplied(n)
          )
        )
      }
    )
  )(nodeDependents)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodesToUpdate.map(async o => {
      const {nodeCtx, nodeDef} = o

      const expressions = getExpressionsFn(nodeDef)

      if (R.isEmpty(expressions))
        return {}

      //3. get expression
      const expr = await getApplicableExpression(survey, nodeCtx, expressions, tx)

      //4. eval expr
      const value = expr
        ? await RecordExprParser.evalNodeQuery(survey, nodeCtx, expr, tx)
        : null

      //5. persist updated node value, and return updated node
      return await isApplicableExpr
        ? NodeDependencyManager.persistDependentNodeApplicable(survey, NodeDef.getUuid(nodeDef), nodeCtx, value || false, tx)
        : NodeDependencyManager.persistDependentNodeValue(survey, nodeCtx, value, isDefaultValuesExpr, tx)
    })
  )

  return R.mergeAll(nodesUpdated)
}

const getApplicableExpression = async (survey, nodeCtx, expressions, tx) => {
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(survey, nodeCtx, applyIfExpr, tx))
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