import * as R from 'ramda'

import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'
import * as Validation from '@core/validation/validation'

import SystemError from '@core/systemError'

const _getNodeValue = (survey, node) => {
  if (Node.isValueBlank(node)) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (NodeDef.isCode(nodeDef)) {
    const itemUuid = Node.getCategoryItemUuid(node)
    return itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
  }

  if (NodeDef.isTaxon(nodeDef)) {
    const taxonUuid = Node.getTaxonUuid(node)
    return taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
  }

  const value = Node.getValue(node)
  return NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)
    ? Number(value)
    : NodeDef.isBoolean(nodeDef)
    ? value === 'true'
    : value
}

const _getReferencedNodesParent = (
  record,
  nodeCtx,
  nodeDefContextH,
  nodeDefReferencedH,
) => {
  if (Node.isRoot(nodeCtx) && nodeDefReferencedH.length === 1) {
    // NodeCtx is root and node referenced is its child
    return nodeCtx
  }

  if (R.startsWith(nodeDefReferencedH, nodeDefContextH)) {
    // NodeDefReferenced belongs to an ancestor of nodeDefContext
    const nodeReferencedParentUuid = Node.getHierarchy(nodeCtx)[
      nodeDefReferencedH.length - 1
    ]
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

  const nodeReferencedParent = _getReferencedNodesParent(
    record,
    nodeCtx,
    nodeDefContextH,
    nodeDefReferencedH,
  )
  if (nodeReferencedParent) {
    return Record.getNodeChildrenByDefUuid(
      nodeReferencedParent,
      NodeDef.getUuid(nodeDefReferenced),
    )(record)
  }

  return []
}

const _identifierEval = (survey, record) => (expr, { node }) => {
  const nodeName = R.prop('name')(expr)
  const referencedNodes = _getReferencedNodes(survey, record, node, nodeName)

  if (referencedNodes.length !== 1) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, {
      name: nodeName,
      multiple: referencedNodes.length > 1,
    })
  }

  return _getNodeValue(survey, referencedNodes[0])
}

export const evalNodeQuery = (survey, record, node, query) => {
  const functions = {
    [Expression.types.Identifier]: _identifierEval(survey, record),
  }

  return Expression.evalString(query, { node, functions })
}

export const evalApplicableExpression = (
  survey,
  record,
  nodeCtx,
  expressions,
) =>
  R.head(evalApplicableExpressions(survey, record, nodeCtx, expressions, true))

export const evalApplicableExpressions = (
  survey,
  record,
  node,
  expressions,
  stopAtFirstFound = false,
) => {
  const applicableExpressions = _getApplicableExpressions(
    survey,
    record,
    node,
    expressions,
    stopAtFirstFound,
  )

  return applicableExpressions.map(expression => ({
    expression,
    value: evalNodeQuery(
      survey,
      record,
      node,
      NodeDefExpression.getExpression(expression),
    ),
  }))
}

const _getApplicableExpressions = (
  survey,
  record,
  nodeCtx,
  expressions,
  stopAtFirstFound = false,
) => {
  const applicableExpressions = []
  for (const expression of expressions) {
    const applyIfExpr = NodeDefExpression.getApplyIf(expression)

    if (
      StringUtils.isBlank(applyIfExpr) ||
      evalNodeQuery(survey, record, nodeCtx, applyIfExpr)
    ) {
      applicableExpressions.push(expression)

      if (stopAtFirstFound) {
        return applicableExpressions
      }
    }
  }

  return applicableExpressions
}
