const R = require('ramda')

const StringUtils = require('@core/stringUtils')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefExpression = require('@core/survey/nodeDefExpression')
const Record = require('@core/record/record')
const Node = require('@core/record/node')
const Expression = require('@core/expressionParser/expression')
const Validation = require('@core/validation/validation')

const SystemError = require('@server/utils/systemError')

const _getNodeValue = (survey, node) => {
  if (Node.isValueBlank(node))
    return null

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (NodeDef.isCode(nodeDef)) {
    const itemUuid = Node.getCategoryItemUuid(node)
    return itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
  } else if (NodeDef.isTaxon(nodeDef)) {
    const taxonUuid = Node.getTaxonUuid(node)
    return taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
  } else {
    const value = Node.getValue(node)
    return NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
      ? Number(value)
      : NodeDef.isBoolean(nodeDef)
        ? value === 'true'
        : value
  }
}

const _getReferencedNodesParent = (record, nodeCtx, nodeDefContextH, nodeDefReferencedH) => {
  if (Node.isRoot(nodeCtx) && nodeDefReferencedH.length === 1) {
    // nodeCtx is root and node referenced is its child
    return nodeCtx
  } else if (R.startsWith(nodeDefReferencedH, nodeDefContextH)) {
    // nodeDefReferenced belongs to an ancestor of nodeDefContext
    const nodeReferencedParentUuid = Node.getHierarchy(nodeCtx)[nodeDefReferencedH.length - 1]
    return Record.getNodeByUuid(nodeReferencedParentUuid)(record)
  }
  return null
}

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const _getReferencedNodes = (survey, record, nodeCtx, nodeReferencedName) => {
  const nodeDefUuidContext = Node.getNodeDefUuid(nodeCtx)
  const nodeDefContext = Survey.getNodeDefByUuid(nodeDefUuidContext)(survey)
  const nodeDefContextH = NodeDef.getMetaHierarchy(nodeDefContext)

  const nodeDefReferenced = Survey.getNodeDefByName(nodeReferencedName)(survey)
  const nodeDefReferencedH = NodeDef.getMetaHierarchy(nodeDefReferenced)

  const nodeReferencedParent = _getReferencedNodesParent(record, nodeCtx, nodeDefContextH, nodeDefReferencedH)
  if (nodeReferencedParent)
    return Record.getNodeChildrenByDefUuid(nodeReferencedParent, NodeDef.getUuid(nodeDefReferenced))(record)

  return []
}

const _identifierEval = (survey, record) => (expr, { node }) => {
  const nodeName = R.prop('name')(expr)
  const referencedNodes = _getReferencedNodes(survey, record, node, nodeName)

  if (referencedNodes.length !== 1) {
    throw new SystemError(
      Validation.messageKeys.expressions.unableToFindNode,
      { name: nodeName, multiple: referencedNodes.length > 1 }
    )
  }

  return _getNodeValue(survey, referencedNodes[0])
}

const evalNodeQuery = async (survey, record, node, query) => {
  const ctx = {
    node,
    functions: {
      [Expression.types.Identifier]: _identifierEval(survey, record),
    }
  }
  return await Expression.evalString(query, ctx)
}

const evalApplicableExpression = async (survey, record, nodeCtx, expressions) =>
  R.head(await evalApplicableExpressions(survey, record, nodeCtx, expressions, true))

const evalApplicableExpressions = async (survey, record, node, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = await _getApplicableExpressions(survey, record, node, expressions, stopAtFirstFound)

  return await Promise.all(applicableExpressions.map(
    async expression => ({
      expression,
      value: await evalNodeQuery(survey, record, node, NodeDefExpression.getExpression(expression))
    })
  ))
}

const _getApplicableExpressions = async (survey, record, nodeCtx, expressions, stopAtFirstFound = false) => {
  const applicableExpressions = []
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (StringUtils.isBlank(applyIfExpr) || await evalNodeQuery(survey, record, nodeCtx, applyIfExpr)) {
      applicableExpressions.push(expression)

      if (stopAtFirstFound)
        return applicableExpressions
    }
  }
  return applicableExpressions
}

module.exports = {
  evalNodeQuery,
  evalApplicableExpression,
  evalApplicableExpressions,
}
