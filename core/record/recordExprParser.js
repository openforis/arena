const R = require('ramda')

const StringUtils = require('@core/stringUtils')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefExpression = require('@core/survey/nodeDefExpression')
const Record = require('./record')
const Node = require('./node')
const Expression = require('@core/exprParser/expression')

const evalNodeQuery = async (survey, record, node, query) => {
  const ctx = {
    node: bindNode(survey, record, node),
    functions: {
      [Expression.types.ThisExpression]: (expr, { node }) => node
    },
  }
  return await Expression.evalString(query, ctx)
}

const bindNode = (survey, record, node) => {

  const getChildNode = (parentNode, name) => {
    const parentNodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(parentNode))(survey)
    const childDef = Survey.getNodeDefChildByName(parentNodeDef, name)(survey)
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)

    return R.isEmpty(children)
      ? null
      : bindNode(survey, record, R.head(children))
  }

  return {
    ...node,

    parent: () => {
      const parentNode = Record.getParentNode(node)(record)
      return parentNode
        ? bindNode(survey, record, parentNode)
        : null
    },

    node: name => getChildNode(node, name),

    sibling: name => {
      const parentNode = Record.getParentNode(node)(record)
      return parentNode
        ? getChildNode(parentNode, name)
        : null
    },

    getValue: () => {
      if (Node.isValueBlank(node)) {
        return null
      }

      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

      if (NodeDef.isCode(nodeDef)) {
        const itemUuid = Node.getCategoryItemUuid(node)
        return itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
      }

      if (NodeDef.isTaxon(nodeDef)) {
        const taxonUuid = Node.getTaxonUuid(node)
        return taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
      }

      const value = Node.getValue(node)

      return NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
        ? Number(value)
        : NodeDef.isBoolean(nodeDef)
          ? value === 'true'
          : value
    }
  }
}

const evalApplicableExpression = async (survey, record, nodeCtx, expressions) =>
  R.head(await evalApplicableExpressions(survey, record, nodeCtx, expressions, true))

const evalApplicableExpressions = async (survey, record, node, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = await _getApplicableExpressions(survey, record, node, expressions, stopAtFirstFound)

  return await Promise.all(
    applicableExpressions.map(async expression => ({
        expression,
        value: await evalNodeQuery(survey, record, node, NodeDefExpression.getExpression(expression))
      })
    )
  )
}

const _getApplicableExpressions = async (survey, record, nodeCtx, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = []
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await evalNodeQuery(survey, record, nodeCtx, applyIfExpr)) {
      applicableExpressions.push(expression)

      if (stopAtFirstFound)
        return applicableExpressions
    }
  }
  return applicableExpressions
}

module.exports = {
  evalNodeQuery,
  evalApplicableExpression,
  evalApplicableExpressions,
}