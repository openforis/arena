const R = require('ramda')

const Node = require('../../../../common/record/node')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')
const NodeRepository = require('../../../record/nodeRepository')

const NodesUpdater = require('./nodesUpdater')

class CalculatedValuesUpdater extends NodesUpdater {

  includeNode (node, nodeDef) {
    return NodeDef.isNodeDefAttribute(nodeDef)
  }

  getNodeDefExpressions (nodeDef) {
    return NodeDef.getCalculatedValues(nodeDef)
  }

  async updateNode (node, calculatedValueExpr, tx) {
    const value = calculatedValueExpr
      ? await RecordExprParser.evalNodeQuery(this.survey, node, NodeDefExpression.getExpression(calculatedValueExpr), tx)
      : null

    const oldValue = Node.getNodeValue(node, null)

    return R.equals(oldValue, value)
      ? {}
      : toUuidIndexedObj([await NodeRepository.updateNode(Survey.getId(this.survey), Node.getUuid(node), value, {[Node.metaKeys.defaultValue]: false}, tx)])
  }
}

module.exports = CalculatedValuesUpdater