import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

const _getNodeValue = (nodeDef) => (NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef) ? { props: { code: '' } } : 1) // Simulates node value

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

export const identifierEval = ({ survey, nodeDefCurrent, selfReferenceAllowed }) => (expr, ctx) => {
  const { node: nodeDefContext } = ctx

  const nodeName = R.prop('name')(expr)

  const reachableNodeDefs = _getReachableNodeDefs(survey, nodeDefContext)

  const def = reachableNodeDefs.find((x) => NodeDef.getName(x) === nodeName)

  if (!def) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, {
      name: nodeName,
    })
  }

  if (!selfReferenceAllowed && NodeDef.isEqual(def)(nodeDefCurrent)) {
    throw new SystemError(Validation.messageKeys.expressions.cannotUseCurrentNode, { name: nodeName })
  }

  if (!Expression.isValidExpressionType(def)) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, {
      name: nodeName,
      type: NodeDef.getType(def),
    })
  }

  if (Survey.isNodeDefDependentOn(NodeDef.getUuid(def), NodeDef.getUuid(nodeDefCurrent))(survey)) {
    throw new SystemError(Validation.messageKeys.expressions.circularDependencyError, { name: nodeName })
  }

  return NodeDef.isEntity(def) || NodeDef.isMultiple(def) ? def : _getNodeValue(def)
}
