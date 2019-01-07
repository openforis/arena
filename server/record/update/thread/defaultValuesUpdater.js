const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')

const NodeRepository = require('../../nodeRepository')

const applyDefaultValue = async (user, survey, node, nodeUpdater, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  for (const defaultValue of NodeDef.getDefaultValues(nodeDef)) {
    const applyIfExpr = NodeDefExpression.getApplyIf(defaultValue)
    if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(survey, node, applyIfExpr, tx)) {
      const value = await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(defaultValue), tx)

      const oldValue = Node.getNodeValue(node)
      if (oldValue !== value) {
        console.log(`update node ${NodeDef.getNodeDefName(nodeDef)} with value ${value}`)
        return toUuidIndexedObj([await nodeUpdater.applyDefaultValue(user, surveyId, node, value, tx)])
      }
    }
  }
  return {}
}

const applyDefaultValues = async (user, survey, nodes, nodeUpdater, tx) =>
  R.mergeAll(
    await Promise.all(
      R.values(nodes).map(
        async node => {
          const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

          if (NodeDef.isNodeDefAttribute(nodeDef) &&
            (Node.isNodeValueBlank(Node.getNodeValue(node, null)) || Node.isDefaultValueApplied(node))
          ) {
            const surveyId = Survey.getSurveyInfo(survey).id
            const parentNode = await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx)

            if (Node.isChildApplicable(nodeDef.uuid)(parentNode)) {
              return await applyDefaultValue(user, survey, node, nodeUpdater, tx)
            }
          }
          return {}
        }
      )
    )
  )

module.exports = {
  applyDefaultValues
}