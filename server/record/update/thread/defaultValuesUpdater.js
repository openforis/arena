const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')
const RecordProcessor = require('./recordProcessor')

const applyDefaultValue = async (user, survey, node, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const defaultValues = NodeDef.getDefaultValues(nodeDef)

  for (const defaultValue of defaultValues) {
    const applyIf = NodeDefExpression.getApplyIf(defaultValue)
    if (StringUtils.isBlank(applyIf) || await RecordExprParser.evalNodeQuery(survey, node, applyIf, tx)) {
      const value = await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(defaultValue), tx)

      //console.log(`update node ${NodeDef.getNodeDefName(nodeDef)} with value ${value}`)

      return await RecordProcessor.persistNode(user, surveyId, Node.assocValue(value)(node), tx)
    }
  }
  return {}
}

const applyDefaultValues = async (user, survey, nodes, tx) =>
  R.mergeAll(
    await Promise.all(
      R.values(nodes).map(async node =>
        Node.isApplicable(node) && Node.isNodeValueBlank(Node.getNodeValue(node, null))
          ? await applyDefaultValue(user, survey, node, tx)
          : {}
      )
    )
  )

module.exports = {
  applyDefaultValues
}