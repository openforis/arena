const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')

const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')
const Node = require('../../../../common/record/node')
const RecordExprParser = require('../../../record/recordExprParser')

class NodesUpdater {

  constructor (user, survey) {
    this.user = user
    this.survey = survey
  }

  /**
   * Abstract method to be overwritten by subclasses.
   * Extracts the node def expressions from a node definition.
   */
  getNodeDefExpressions (nodeDef) {
    return []
  }

  /**
   * Abstract method to be overwritten by subclasses.
   * Updates a node using the specified nodeDefExpression.
   */
  async updateNode (node, nodeDefExpression, client) {
    return {}
  }

  /**
   * Abstract method to be overwritten by subclasses.
   * Tells if a node should be updated or not (true by default).
   */
  includeNode (node, nodeDef) {
    return true
  }

  /**
   * Iterates over the nodes and applies the specified nodeUpdateFunction
   */
  async updateNodes (nodesArray, tx) {
    return R.mergeAll(
      await Promise.all(
        nodesArray.map(async node => {
          const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(this.survey)

          if (this.includeNode(node, nodeDef)) {
            const expressions = this.getNodeDefExpressions(nodeDef)

            return R.isEmpty(expressions)
              ? {}
              : await this._evaluateApplicableExpression(expressions, node, tx)
          } else {
            return {}
          }
        })
      )
    )
  }

  /**
   * Iterates over the expressions and evaluates the one having an empty or verified "apply if"
   */
  async _evaluateApplicableExpression (expressions, node, tx) {
    for (const expression of expressions) {
      const applyIfExpr = NodeDefExpression.getApplyIf(expression)

      if (StringUtils.isBlank(applyIfExpr) || await RecordExprParser.evalNodeQuery(this.survey, node, applyIfExpr, tx)) {
        return await this.updateNode(node, expression, tx)
      }
    }
    return await this.updateNode(node, null, tx)
  }

}

module.exports = NodesUpdater