const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefExpression = require('../../common/survey/nodeDefExpression')
const Node = require('../../common/record/node')
const Expression = require('../../common/exprParser/expression')
const NodeRepository = require('./nodeRepository')
const StringUtils = require('../../common/stringUtils')

const evalNodeQuery = async (survey, node, query, client, bindNodeFn = bindNode) => {
  const ctx = {
    node: bindNodeFn(survey, node, client),
    functions: {
      [Expression.types.ThisExpression]: (expr, {node}) => node
    },
  }
  return await Expression.evalString(query, ctx)
}

const bindNode = (survey, node, tx) => {
  const surveyId = Survey.getId(survey)

  return {
    ...node,

    parent: async () => bindNode(survey, await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx), tx),

    node: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const childDef = Survey.getNodeDefChildByName(nodeDef, name)(survey)
      const child = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getUuid(node), NodeDef.getUuid(childDef), tx)
      return child ? bindNode(survey, child, tx) : null
    },

    sibling: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      const childDef = Survey.getNodeDefChildByName(parentDef, name)(survey)
      const sibling = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getParentUuid(node), NodeDef.getUuid(childDef), tx)
      return sibling ? bindNode(survey, sibling, tx) : null
    },

    value: async () => {
      if (Node.isNodeValueBlank(node)) {
        return null
      }

      const value = Node.getNodeValue(node)
      const nodeDefUuid = Node.getNodeDefUuid(node)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      return NodeDef.isNodeDefDecimal(nodeDef) || NodeDef.isNodeDefInteger(nodeDef)
        ? Number(value)
        : value
    }
  }
}

const getApplicableExpressions = async (survey, nodeCtx, expressions, tx, stopAtFirstFound = false) => {
  const applicableExpressions = []
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await evalNodeQuery(survey, nodeCtx, applyIfExpr, tx)) {
      const expr = NodeDefExpression.getExpression(expression)
      if (stopAtFirstFound)
        return expr
      else
        applicableExpressions.push(expr)
    }
  }
  return applicableExpressions
}

const getApplicableExpression = async (survey, nodeCtx, expressions, tx) =>
  R.head(getApplicableExpressions(survey, nodeCtx, expressions, tx))

module.exports = {
  evalNodeQuery,
  getApplicableExpressions,
  getApplicableExpression
}