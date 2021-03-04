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
const _getReferencedNodes = ({ survey, record, node, nodeDefReferenced }) => {
  const nodeReferencedParent = _getReferencedNodesParent(survey, record, node, nodeDefReferenced)

  if (nodeReferencedParent) {
    return Record.getNodeChildrenByDefUuid(nodeReferencedParent, NodeDef.getUuid(nodeDefReferenced))(record)
  }
  return []
}

export const identifierEval = (survey, record) => (expr, { node: nodeContext, evaluateToNode }) => {
  const exprName = Expression.getName(expr)

  // identifier is global object
  const globalIdentifierEvalResult = Expression.globalIdentifierEval({ identifierName: exprName, nodeContext })
  if (globalIdentifierEvalResult !== null) {
    return globalIdentifierEvalResult
  }

  // identifier is a native property or function (e.g. String.length or String.toUpperCase())
  // or a composite attribute value member (e.g. coordinate.x, species.scientificName)
  const prop = nodeContext[exprName]
  if (prop !== undefined) {
    return prop instanceof Function ? prop.bind(nodeContext) : prop
  }

  // identifier references a node or a node value prop
  const node = nodeContext
  const nodeDefCtx = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (Node.isValueProp({ nodeDef: nodeDefCtx, prop: exprName })) {
    return Node.getValueProp(exprName)(node)
  }

  const nodeDefReferenced = Survey.getNodeDefByName(exprName)(survey)

  let nodeResult = null
  if (NodeDef.isEqual(nodeDefCtx)(nodeDefReferenced)) {
    // the referenced node is the current node itself
    nodeResult = node
  }
  if (Survey.isNodeDefAncestor(nodeDefReferenced, nodeDefCtx)(survey)) {
    // if the rerenced node name is an ancestor of the current node, return it following the hierarchy
    nodeResult = Record.getAncestorByNodeDefUuid(node, NodeDef.getUuid(nodeDefReferenced))(record)
  }
  if (nodeResult) {
    return evaluateToNode || NodeDef.isEntity(nodeDefCtx) ? nodeResult : _getNodeValue(survey)(nodeResult)
  }

  // the referenced nodes can be siblings of the current node
  const referencedNodes = _getReferencedNodes({ survey, record, node, nodeDefReferenced })

  const single = NodeDef.isSingle(nodeDefReferenced)
  if (single && (referencedNodes.length === 0 || referencedNodes.length > 1)) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, { name: exprName })
  }

  if (NodeDef.isAttribute(nodeDefReferenced) && !evaluateToNode && !NodeDef.isAttributeComposite(nodeDefReferenced)) {
    // return node values
    const values = referencedNodes.map((referencedNode) => _getNodeValue(survey)(referencedNode))
    return single ? values[0] : values
  }
  // return nodes
  return single ? referencedNodes[0] : referencedNodes
}
