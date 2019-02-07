const R = require('ramda')

const StringUtils = require('../../common/stringUtils')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefExpression = require('../../common/survey/nodeDefExpression')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')
const Expression = require('../../common/exprParser/expression')

const CategoryManager = require('../category/categoryManager')
const TaxonomyManager = require('../taxonomy/taxonomyManager')

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
      if (Node.isNodeValueBlank(node)) {
        return null
      }

      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const surveyId = Survey.getId(survey)
      const draft = Survey.isDraft(Survey.getSurveyInfo(survey))

      if (NodeDef.isNodeDefCode(nodeDef)) {
        const itemUuid = Node.getCategoryItemUuid(node)
        return itemUuid ? await CategoryManager.fetchItemByUuid(surveyId, itemUuid, draft) : null
      }

      if (NodeDef.isNodeDefTaxon(nodeDef)) {
        const taxonUuid = Node.getNodeTaxonUuid(node)
        return taxonUuid ? await TaxonomyManager.fetchTaxonByUuid(surveyId, taxonUuid, draft) : null
      }

      const value = Node.getNodeValue(node)

      return NodeDef.isNodeDefDecimal(nodeDef) || NodeDef.isNodeDefInteger(nodeDef)
        ? Number(value)
        : value
    }
  }
}

const getApplicableExpressions = async (survey, record, nodeCtx, expressions, tx, stopAtFirstFound = false) => {
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

const getApplicableExpression = async (survey, record, nodeCtx, expressions, tx) =>
  R.head(await getApplicableExpressions(survey, record, nodeCtx, expressions, tx, true))

module.exports = {
  evalNodeQuery,
  getApplicableExpressions,
  getApplicableExpression
}