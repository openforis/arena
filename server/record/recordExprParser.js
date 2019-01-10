const Survey = require('../../common/survey/survey')
const Node = require('../../common/record/node')
const Expression = require('../../common/exprParser/expression')
const NodeRepository = require('./nodeRepository')

const evalNodeQuery = async (survey, node, query, client) => {
  const ctx = {
    node: bindNode(survey, node, client),
    functions: {
      [Expression.types.ThisExpression]: (expr, {node}) => node
    },
  }
  return await Expression.evalString(query, ctx)
}

const bindNode = (survey, node, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id

  return {
    ...node,

    parent: async () => bindNode(survey, await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx), tx),

    node: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const childDef = Survey.getNodeDefChildByName(nodeDef, name)(survey)
      const child = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), node.uuid, childDef.uuid, tx)
      return child ? bindNode(survey, child, tx) : null
    },

    sibling: async name => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
      const childDef = Survey.getNodeDefChildByName(parentDef, name)(survey)
      const sibling = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getParentUuid(node), childDef.uuid, tx)
      return sibling ? bindNode(survey, sibling, tx) : null
    }
  }
}

module.exports = {
  evalNodeQuery,
}