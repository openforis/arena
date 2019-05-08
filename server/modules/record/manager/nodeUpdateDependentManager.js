const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const NodeDependencyManager = require('./nodeDependencyManager')

const RecordExprParser = require('../recordExprParser')

/**
 * Module responsible for updating applicable and default values
 */

const updateDependentsApplicable = async (survey, record, node, tx) => {

  //1. fetch dependent nodes
  const nodesToUpdate = Record.getDependentNodes(survey, node, Survey.dependencyTypes.applicable)(record)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodesToUpdate.map(async o => {
      const { nodeCtx, nodeDef } = o

      const expressions = NodeDef.getApplicable(nodeDef)

      //3. get expression
      const expr = await RecordExprParser.getApplicableExpression(survey, record, nodeCtx, expressions, tx)

      //4. eval expr
      const valueExpr = expr
        ? await RecordExprParser.evalNodeQuery(survey, record, nodeCtx, NodeDefExpression.getExpression(expr), tx)
        : null

      //5. persist updated node value, and return updated node
      return await NodeDependencyManager.persistDependentNodeApplicable(survey, NodeDef.getUuid(nodeDef), nodeCtx, valueExpr || false, tx)
    })
  )

  return R.mergeAll(nodesUpdated)
}

const updateDependentsDefaultValues = async (survey, record, node, tx) => {

  //1. fetch dependent nodes
  const nodeDependents = Record.getDependentNodes(survey, node, Survey.dependencyTypes.defaultValues)(record)

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodesToUpdate = R.pipe(
    R.append({ nodeCtx: node, nodeDef: Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey) }),
    R.filter(o => {
        const { nodeCtx: n, nodeDef } = o
        return (
          NodeDef.isAttribute(nodeDef) && (
            Node.isValueBlank(n) ||
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

      const expressions = NodeDef.getDefaultValues(nodeDef)

      //3. get expression
      const expr = await RecordExprParser.getApplicableExpression(survey, record, nodeCtx, expressions, tx)

      //4. eval expr
      const valueExpr = expr
        ? await RecordExprParser.evalNodeQuery(survey, record, nodeCtx, NodeDefExpression.getExpression(expr), tx)
        : null

      //5. persist updated node value, and return updated node
      return await NodeDependencyManager.persistDependentNodeValue(survey, nodeCtx, valueExpr, !R.isNil(expr), tx)
    })
  )

  return R.mergeAll(nodesUpdated)
}

module.exports = {
  updateDependentsDefaultValues,
  updateDependentsApplicable,
}