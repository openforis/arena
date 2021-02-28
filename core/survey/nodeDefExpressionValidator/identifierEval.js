import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'
import * as Expression from '@core/expressionParser/expression'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const _getReachableNodeDefs = (survey, nodeDefContext) => {
  const reachableNodeDefs = []

  const queue = new Queue()
  const visitedUuids = []

  queue.enqueue(NodeDef.isEntity(nodeDefContext) ? nodeDefContext : Survey.getNodeDefParent(nodeDefContext)(survey))

  while (!queue.isEmpty()) {
    const entityDefCurrent = queue.dequeue()
    const entityDefCurrentUuid = NodeDef.getUuid(entityDefCurrent)
    const entityDefCurrentChildren = Survey.getNodeDefChildren(entityDefCurrent)(survey)

    reachableNodeDefs.push(entityDefCurrent)
    reachableNodeDefs.push(...entityDefCurrentChildren)

    // visit nodes inside single entities
    queue.enqueueItems(entityDefCurrentChildren.filter(NodeDef.isSingleEntity))

    // avoid visiting 2 times the same entity definition when traversing single entities
    if (!visitedUuids.includes(entityDefCurrentUuid)) {
      const entityDefCurrentParent = Survey.getNodeDefParent(entityDefCurrent)(survey)
      if (entityDefCurrentParent) {
        queue.enqueue(entityDefCurrentParent)
      }
    }
    visitedUuids.push(entityDefCurrentUuid)
  }
  return reachableNodeDefs
}

export const identifierEval = ({ survey, nodeDefCurrent }) => (expr, ctx) => {
  const { node: exprContext, selfReferenceAllowed = true } = ctx

  const exprName = Expression.getName(expr)

  const globalIdentifierEvalResult = Expression.globalIdentifierEval({ identifierName: exprName, exprContext })
  if (globalIdentifierEvalResult !== null) {
    return globalIdentifierEvalResult
  }

  // identifier is a native property or function (e.g. String.length or String.toUpperCase())
  if (NodeNativeProperties.hasNativeProperty({ nodeDef: exprContext, propName: exprName })) {
    return NodeNativeProperties.evalNodeDefProperty({ nodeDef: exprContext, propName: exprName })
  }

  // identifier references a node
  const reachableNodeDefs = _getReachableNodeDefs(survey, exprContext)

  const def = reachableNodeDefs.find((x) => NodeDef.getName(x) === exprName)

  if (!def) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, { name: exprName })
  }

  if (!selfReferenceAllowed && NodeDef.isEqual(def)(nodeDefCurrent)) {
    throw new SystemError(Validation.messageKeys.expressions.cannotUseCurrentNode, { name: exprName })
  }

  if (!Expression.isValidExpressionType(def)) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, {
      name: exprName,
      type: NodeDef.getType(def),
    })
  }

  if (Survey.isNodeDefDependentOn(NodeDef.getUuid(def), NodeDef.getUuid(nodeDefCurrent))(survey)) {
    throw new SystemError(Validation.messageKeys.expressions.circularDependencyError, { name: exprName })
  }

  return def
}
