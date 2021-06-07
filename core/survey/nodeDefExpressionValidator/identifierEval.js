import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'
import * as Expression from '@core/expressionParser/expression'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

// Determines the actual context node def
// - attribute def => parent entity def
// - virtual entity def => source node def
// - entity def => entity def itself
const _findActualContextNode = ({ survey, nodeDefContext }) => {
  if (NodeDef.isAttribute(nodeDefContext)) {
    return Survey.getNodeDefParent(nodeDefContext)(survey)
  }
  if (NodeDef.isVirtual(nodeDefContext)) {
    return Survey.getNodeDefSource(nodeDefContext)(survey)
  }
  return nodeDefContext
}

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const _getReachableNodeDefs = (survey, nodeDefContext) => {
  const reachableNodeDefs = []

  const queue = new Queue()
  const visitedUuids = []

  const actualContextNode = _findActualContextNode({ survey, nodeDefContext })
  if (actualContextNode) queue.enqueue(actualContextNode)

  while (!queue.isEmpty()) {
    const entityDefCurrent = queue.dequeue()
    const entityDefCurrentUuid = NodeDef.getUuid(entityDefCurrent)
    const entityDefCurrentChildren = Survey.getNodeDefChildren(entityDefCurrent)(survey)

    reachableNodeDefs.push(entityDefCurrent, ...entityDefCurrentChildren)

    // visit nodes inside single entities
    queue.enqueueItems(entityDefCurrentChildren.filter(NodeDef.isSingleEntity))

    // avoid visiting 2 times the same entity definition when traversing single entities
    if (!visitedUuids.includes(entityDefCurrentUuid)) {
      const entityDefCurrentParent = Survey.getNodeDefParent(entityDefCurrent)(survey)
      if (entityDefCurrentParent) {
        queue.enqueue(entityDefCurrentParent)
      }
      visitedUuids.push(entityDefCurrentUuid)
    }
  }
  return reachableNodeDefs
}

export const identifierEval =
  ({ survey, nodeDefCurrent }) =>
  (expr, ctx) => {
    const { node: nodeContext, selfReferenceAllowed = true } = ctx

    const exprName = Expression.getName(expr)

    const globalIdentifierEvalResult = Expression.globalIdentifierEval({ identifierName: exprName, nodeContext })
    if (globalIdentifierEvalResult !== null) {
      return globalIdentifierEvalResult
    }

    // check if identifier is a native property or function (e.g. String.length or String.toUpperCase())
    if (NodeNativeProperties.hasNativeProperty({ nodeDefOrValue: nodeContext, propName: exprName })) {
      return NodeNativeProperties.evalNodeDefProperty({ nodeDefOrValue: nodeContext, propName: exprName })
    }

    // check if identifier is a composite attribute value prop
    if (NodeDef.isAttribute(nodeContext) && Node.isValueProp({ nodeDef: nodeContext, prop: exprName })) {
      return nodeContext
    }

    // identifier references a node
    const reachableNodeDefs = _getReachableNodeDefs(survey, nodeContext)

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
