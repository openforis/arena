const R = require('ramda')
const Promise = require('bluebird')

const Queue = require('../../../../common/queue')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const NodeDependencyManager = require('./nodeDependencyManager')

const RecordExprParser = require('../recordExprParser')

const { dependencyTypes } = Survey

/**
 * Module responsible for updating applicable and default values
 */

const updateNodes = async (survey, record, nodes, tx) => {
  const nodesArray = R.values(nodes)
  const nodesUpdated = nodesArray
  const nodesToVisit = new Queue(nodesArray)
  const nodeUuidsVisited = []

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    // visit only unvisited nodes
    if (!R.includes(nodeUuid, nodeUuidsVisited)) {

      // update node
      const nodesUpdatedCurrent = await updateNode(survey, record, node, tx)
      record = Record.assocNodes(nodesUpdatedCurrent)(record)

      // mark updated nodes to visit
      const nodesUpdatedCurrentArray = R.values(nodesUpdatedCurrent)
      nodesToVisit.enqueueItems(nodesUpdatedCurrentArray)

      // update nodes to return
      for (const nodeUpdated of nodesUpdatedCurrentArray) {
        const idx = R.findIndex(
          R.propEq(Node.keys.uuid, Node.getUuid(nodeUpdated))
        )(nodesUpdated)

        idx >= 0
          ? nodesUpdated[idx] = R.mergeDeepRight(nodesUpdated[idx], nodeUpdated)
          : nodesUpdated.push(nodeUpdated)

      }

      // mark node visited
      nodeUuidsVisited.push(nodeUuid)
    }
  }

  return SurveyUtils.toUuidIndexedObj(nodesUpdated)
}

const updateNode = async (survey, record, node, tx) => {

  const nodesApplicability = await updateNodeExpr(survey, record, node, NodeDef.getApplicable, dependencyTypes.applicable, tx)
  const nodesDefaultValues = await updateNodeExpr(survey, record, node, NodeDef.getDefaultValues, dependencyTypes.defaultValues, tx)

  return R.mergeRight(nodesApplicability, nodesDefaultValues)
}

const updateNodeExpr = async (survey, record, node, getExpressionsFn, dependencyType, tx) => {

  //1. fetch dependent nodes
  const nodeDependents = NodeDependencyManager.fetchDependentNodes(survey, record, node, dependencyType)
  const isDefaultValuesExpr = dependencyType === dependencyTypes.defaultValues
  const isApplicableExpr = dependencyType === dependencyTypes.applicable

  // filter nodes to update
  const nodesToUpdate = R.pipe(
    R.ifElse(
      R.always(isDefaultValuesExpr),
      R.append({ nodeCtx: node, nodeDef: Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey) }),
      R.identity
    ),
    R.filter(o => {
        const { nodeCtx: n, nodeDef } = o

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
      const { nodeCtx, nodeDef } = o

      const expressions = getExpressionsFn(nodeDef)

      //3. get expression
      const expr = await RecordExprParser.getApplicableExpression(survey, record, nodeCtx, expressions, tx)

      //4. eval expr
      const valueExpr = expr
        ? await RecordExprParser.evalNodeQuery(survey, record, nodeCtx, NodeDefExpression.getExpression(expr), tx)
        : null

      //5. persist updated node value, and return updated node
      return await isApplicableExpr
        ? NodeDependencyManager.persistDependentNodeApplicable(survey, NodeDef.getUuid(nodeDef), nodeCtx, valueExpr || false, tx)
        : NodeDependencyManager.persistDependentNodeValue(survey, nodeCtx, valueExpr, isDefaultValuesExpr && !R.isNil(expr), tx)
    })
  )

  return R.mergeAll(nodesUpdated)
}

module.exports = {
  updateNodes
}