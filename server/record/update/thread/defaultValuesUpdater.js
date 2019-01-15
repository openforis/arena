const R = require('ramda')

const Node = require('../../../../common/record/node')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')
const NodeRepository = require('../../../record/nodeRepository')

const NodesUpdater = require('./nodesUpdater')

class DefaultValuesUpdater extends NodesUpdater {

  getNodeDefExpressions (nodeDef) {
    return NodeDef.getDefaultValues(nodeDef)
  }

  includeNode (node, nodeDef) {
    return NodeDef.isNodeDefAttribute(nodeDef) &&
      (Node.isNodeValueBlank(Node.getNodeValue(node, null)) || Node.isDefaultValueApplied(node))
  }

  async updateNode (node, defaultValueNodeExpr, tx) {
    const value = defaultValueNodeExpr
      ? await RecordExprParser.evalNodeQuery(this.survey, node, NodeDefExpression.getExpression(defaultValueNodeExpr), tx)
      : null

    const oldValue = Node.getNodeValue(node, null)

    return R.equals(oldValue, value)
      ? {}
      : toUuidIndexedObj([await NodeRepository.updateNode(Survey.getId(this.survey), Node.getUuid(node), value, {[Node.metaKeys.defaultValue]: true}, tx)])
  }

}

module.exports = DefaultValuesUpdater