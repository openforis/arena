const StringUtils = require('../../../../common/stringUtils')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')
const NodeRepository = require('../../../record/nodeRepository')

const NodesUpdater = require('./nodesUpdater')

class ApplicableUpdater extends NodesUpdater {

  getNodeDefExpressions (nodeDef) {
    return NodeDef.getApplicable(nodeDef)
  }

  includeNode (node, nodeDef) {
    return !NodeDef.isNodeDefRoot(nodeDef)
  }

  async updateNode (node, applicableExpr, tx) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(this.survey)

    const surveyId = Survey.getId(this.survey)
    const parentNode = await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx)

    const newApplicability = await this._isApplicable(node, applicableExpr, tx)

    if (newApplicability !== Node.isChildApplicable(Node.getNodeDefUuid(node))(parentNode)) {
      await NodeRepository.updateChildrenApplicability(surveyId, Node.getParentUuid(node), NodeDef.getUuid(nodeDef), newApplicability, tx)
      return toUuidIndexedObj(await NodeRepository.fetchChildNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getUuid(parentNode), Node.getNodeDefUuid(node), tx))
    } else {
      return {}
    }
  }

  async _isApplicable (node, applicableExpr, client) {
    const expression = NodeDefExpression.getExpression(applicableExpr)

    return StringUtils.isBlank(expression)
      ? true
      : await RecordExprParser.evalNodeQuery(this.survey, node, expression, client)
  }
}

module.exports = ApplicableUpdater
