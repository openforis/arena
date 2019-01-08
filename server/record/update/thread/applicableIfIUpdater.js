const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')

class ApplicableIfUpdater {

  constructor (nodeRepository) {
    this.nodeRepository = nodeRepository
  }

  async updateNodesApplicability (user, survey, nodesArray, nodeUpdater, tx) {
    return R.mergeAll(
      await Promise.all(
        nodesArray.map(async node => {
          const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

          if (!NodeDef.isNodeDefRoot(nodeDef)) {
            const surveyId = Survey.getSurveyInfo(survey).id
            const parentNode = await this.nodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx)

            const newApplicability = await this._isApplicable(survey, node, tx)

            if (newApplicability !== Node.isChildApplicable(Node.getNodeDefUuid(node))(parentNode)) {
              await this.nodeRepository.updateChildrenApplicability(surveyId, Node.getParentUuid(node), NodeDef.getUuid(nodeDef), newApplicability, tx)
              return toUuidIndexedObj(await this.nodeRepository.fetchChildNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), parentNode.uuid, Node.getNodeDefUuid(node), tx))
            }
          }
          return {}
        })
      )
    )
  }

  async _isApplicable (survey, node, tx) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const applicableIfExpr = R.pipe(
      NodeDef.getApplicable,
      R.head,
      NodeDefExpression.getExpression
    )(nodeDef)

    return StringUtils.isBlank(applicableIfExpr)
      ? true
      : await RecordExprParser.evalNodeQuery(node, applicableIfExpr)
  }

}

module.exports = ApplicableIfUpdater
