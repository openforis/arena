const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')

class DefaultValuesUpdater {

  constructor (nodeRepository) {
    this.nodeRepository = nodeRepository
  }

  async applyDefaultValue (user, survey, node, tx) {
    const surveyId = Survey.getSurveyInfo(survey).id
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    for (const defaultValue of NodeDef.getDefaultValues(nodeDef)) {
      const applyIfExpr = NodeDefExpression.getApplyIf(defaultValue)

      if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(survey, node, applyIfExpr, tx)) {

        const value = await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(defaultValue), tx)

        const oldValue = Node.getNodeValue(node)
        if (R.equals(oldValue, value)) {
          return {}
        } else {
          console.log(`apply default value ${value} to node ${NodeDef.getNodeDefName(nodeDef)}`)
          return toUuidIndexedObj([await this.nodeRepository.updateNode(surveyId, Node.getUuid(node), value, {[Node.metaKeys.defaultValue]: true}, tx)])
        }
      }
    }
    return {}
  }

  async applyDefaultValues (user, survey, nodesArray, tx) {
    return R.mergeAll(
      await Promise.all(
        nodesArray.map(
          async node => {
            const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

            if (NodeDef.isNodeDefAttribute(nodeDef) &&
              (Node.isNodeValueBlank(Node.getNodeValue(node, null)) || Node.isDefaultValueApplied(node))
            ) {
              return await this.applyDefaultValue(user, survey, node, tx)
            }
            return {}
          }
        )
      )
    )
  }
}

module.exports = DefaultValuesUpdater