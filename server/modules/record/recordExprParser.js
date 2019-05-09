const R = require('ramda')

const StringUtils = require('../../../common/stringUtils')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')
const Expression = require('../../../common/exprParser/expression')

const CategoryManager = require('../category/manager/categoryManager')
const TaxonomyManager = require('../taxonomy/manager/taxonomyManager')

const evalNodeQuery = async (survey, record, node, query, client, bindNodeFn = bindNode) => {
  const ctx = {
    node: bindNodeFn(survey, record, node),
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

    parent: async () => bindNode(
      survey,
      record,
      Record.getParentNode(node)(record)
    ),

    node: name => getChildNode(node, name),

    sibling: async name => {
      const parentNode = Record.getParentNode(node)(record)
      return getChildNode(parentNode, name)
    },

    getValue: async () => {
      if (Node.isValueBlank(node)) {
        return null
      }

      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const surveyId = Survey.getId(survey)
      const draft = Survey.isDraft(Survey.getSurveyInfo(survey))

      if (NodeDef.isCode(nodeDef)) {
        const itemUuid = Node.getCategoryItemUuid(node)
        return itemUuid ? await CategoryManager.fetchItemByUuid(surveyId, itemUuid, draft) : null
      }

      if (NodeDef.isTaxon(nodeDef)) {
        const taxonUuid = Node.getTaxonUuid(node)
        return taxonUuid ? await TaxonomyManager.fetchTaxonByUuid(surveyId, taxonUuid, draft) : null
      }

      const value = Node.getValue(node)

      return NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
        ? Number(value)
        : value
    }
  }
}

const evalApplicableExpression = async (survey, record, nodeCtx, expressions, tx) =>
  R.head(await evalApplicableExpressions(survey, record, nodeCtx, expressions, tx, true))

const evalApplicableExpressions = async (survey, record, node, expressions, tx, stopAtFirstFound = false) => {
  const applicableExpressions = await _getApplicableExpressions(survey, record, node, expressions, tx, stopAtFirstFound)

  return await Promise.all(
    applicableExpressions.map(async expression => ({
        expression,
        value: await evalNodeQuery(survey, record, node, NodeDefExpression.getExpression(expression), tx)
      })
    )
  )
}

const _getApplicableExpressions = async (survey, record, nodeCtx, expressions, tx, stopAtFirstFound = false) => {
  const applicableExpressions = []
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await evalNodeQuery(survey, record, nodeCtx, applyIfExpr, tx)) {
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