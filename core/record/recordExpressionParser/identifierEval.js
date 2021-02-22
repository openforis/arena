import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Expression from '@core/expressionParser/expression'
import * as Validation from '@core/validation/validation'

import SystemError from '@core/systemError'

const _getNodeValue = (survey) => (node) => {
  if (Node.isValueBlank(node)) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (NodeDef.isCode(nodeDef)) {
    const itemUuid = Node.getCategoryItemUuid(node)
    const item = itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
    return item ? CategoryItem.getCode(item) : null
  }

  if (NodeDef.isTaxon(nodeDef)) {
    const taxonUuid = Node.getTaxonUuid(node)
    const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
    return taxon ? Taxon.getCode(taxon) : null
  }

  const value = Node.getValue(node)
  if (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) {
    return Number(value)
  }
  if (NodeDef.isBoolean(nodeDef)) {
    return value === 'true'
  }
  return value
}

const _getNodeCommonAncestor = ({ record, nodeCtxHierarchy, nodeDefCtx, nodeDefReferenced }) => {
  if (NodeDef.isRoot(nodeDefCtx)) {
    return Record.getRootNode(record)
  }
  const nodeDefReferencedH = NodeDef.getMetaHierarchy(nodeDefReferenced)
  const nodeDefCtxH = NodeDef.getMetaHierarchy(nodeDefCtx)
  const nodeDefCommonH = R.intersection(nodeDefReferencedH, nodeDefCtxH)
  if (nodeDefCommonH.length === 1) {
    return Record.getRootNode(record)
  }
  if (nodeDefCommonH.length > 1) {
    const nodeCommonAncestorUuid = nodeCtxHierarchy[nodeDefCommonH.length - 1]
    return Record.getNodeByUuid(nodeCommonAncestorUuid)(record)
  }

  return null
}

const _getReferencedNodesParent = (survey, record, nodeCtx, nodeDefReferenced) => {
  const nodeDefUuidCtx = Node.getNodeDefUuid(nodeCtx)
  const nodeDefCtx = Survey.getNodeDefByUuid(nodeDefUuidCtx)(survey)

  // Referenced node is a child of the context node
  if (NodeDef.getParentUuid(nodeDefReferenced) === NodeDef.getUuid(nodeDefCtx)) {
    return nodeCtx
  }

  const nodeDefReferencedH = NodeDef.getMetaHierarchy(nodeDefReferenced)
  const nodeDefCtxH = NodeDef.getMetaHierarchy(nodeDefCtx)

  const nodeCtxH = [...Node.getHierarchy(nodeCtx)]
  if (NodeDef.isEntity(nodeDefCtx)) {
    // When nodeDefCtx is entity, expression is type applicableIf (and context always starts from parent)
    nodeCtxH.push(Node.getUuid(nodeCtx))
  }

  if (R.startsWith(nodeDefReferencedH, nodeDefCtxH)) {
    // Referenced node is a descendant of an ancestor of the context node
    const nodeReferencedParentUuid = nodeCtxH[nodeDefReferencedH.length - 1]
    return Record.getNodeByUuid(nodeReferencedParentUuid)(record)
  }
  const nodeCommonAncestor = _getNodeCommonAncestor({
    record,
    nodeCtxHierarchy: nodeCtxH,
    nodeDefCtx,
    nodeDefReferenced,
  })
  if (!nodeCommonAncestor) {
    return null
  }
  // starting from nodeCommonAncestor, visit descendant entities up to referenced node parent entity
  return nodeDefReferencedH
    .slice(nodeDefReferencedH.indexOf(Node.getNodeDefUuid(nodeCommonAncestor)) + 1)
    .reduce(
      (nodeParent, nodeDefChildUuid) => Record.getNodeChildByDefUuid(nodeParent, nodeDefChildUuid)(record),
      nodeCommonAncestor
    )
}

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const _getReferencedNodes = (survey, record, nodeCtx, nodeDefReferenced) => {
  const nodeReferencedParent = _getReferencedNodesParent(survey, record, nodeCtx, nodeDefReferenced)

  if (nodeReferencedParent)
    return Record.getNodeChildrenByDefUuid(nodeReferencedParent, NodeDef.getUuid(nodeDefReferenced))(record)

  return []
}

export const identifierEval = (survey, record) => (expr, { node }) => {
  const nodeName = Expression.getName(expr)

  const nodeDefReferenced = Survey.getNodeDefByName(nodeName)(survey)
  const referencedNodes = _getReferencedNodes(survey, record, node, nodeDefReferenced)

  const single = NodeDef.isSingle(nodeDefReferenced)
  if (single && (referencedNodes.length === 0 || referencedNodes.length > 1)) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, { name: nodeName })
  }

  if (NodeDef.isAttribute(nodeDefReferenced)) {
    const values = referencedNodes.map((referencedNode) => _getNodeValue(survey)(referencedNode))
    return single ? values[0] : values
  }
  return single ? referencedNodes[0] : referencedNodes
}
