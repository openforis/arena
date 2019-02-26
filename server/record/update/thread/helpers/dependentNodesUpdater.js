const R = require('ramda')
const Promise = require('bluebird')

const Queue = require('../../../../../common/queue')

const SurveyUtils = require('../../../../../common/survey/surveyUtils')
const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../../common/survey/nodeDefExpression')
const Node = require('../../../../../common/record/node')

const { dependencyTypes } = require('../../../../survey/surveyDependenchyGraph')

const NodeDependencyManager = require('../../../nodeDependencyManager')

const RecordExprParser = require('../../../recordExprParser')

/**
 * Module responsible for updating applicable and default values
 */

const updateNodes = async (survey, record, nodes, tx) => {
  let allUpdatedNodes = R.values(nodes)

  const nodesToVisit = new Queue(R.values(nodes))
  const visitedNodeUuids = []

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    // visit only unvisited nodes
    if (!R.includes(nodeUuid, visitedNodeUuids)) {

      // update node
      const lastUpdatedNodes = await updateNode(survey, record, node, tx)

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