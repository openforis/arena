import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

const _getNodeValue = (nodeDef) => (NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef) ? { props: { code: '' } } : 1) // Simulates node value

const _isNodePropertyAllowed = ({ nodeDefContext, propertyName }) =>
  propertyName === 'length' && NodeDef.isMultiple(nodeDefContext)

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

const _identifierEval = ({ survey, nodeDefCurrent, selfReferenceAllowed }) => (expr, ctx) => {
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

  return NodeDef.isEntity(def) ? def : _getNodeValue(def)
}

const _memberPropertyEval = ({ survey, nodeDefContext, property }) => {
  const propertyName = Expression.getName(property)

  if (_isNodePropertyAllowed({ nodeDefContext, propertyName })) {
    // simulate node property getter
    return {}
  }

  const childDef = Survey.getNodeDefChildByName(nodeDefContext, propertyName)(survey)
  if (!childDef) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, { name: propertyName })
  }
  return childDef
}

const _memberEval = ({ survey }) => (expr, ctx) => {
  const { object, property } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })
  if (R.isNil(objectEval)) {
    return null
  }
  if (Expression.isIdentifier(property)) {
    return _memberPropertyEval({ survey, nodeDefContext: objectEval, property })
  }
  if (Expression.isLiteral(property)) {
    // simulate access to element at index, but return only the node def
    return objectEval
  }
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}

export const validate = ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
}) => {
  const functions = {
    [Expression.types.Identifier]: _identifierEval({ survey, nodeDefCurrent, selfReferenceAllowed }),
    [Expression.types.MemberExpression]: _memberEval({ survey }),
  }
  try {
    const nodeDefContext = isContextParent ? Survey.getNodeDefParent(nodeDefCurrent)(survey) : nodeDefCurrent
    Expression.evalString(exprString, { functions, node: nodeDefContext })
    return null
  } catch (error) {
    const details = R.is(SystemError, error) ? `$t(${error.key})` : error.toString()
    return ValidationResult.newInstance(Validation.messageKeys.expressions.expressionInvalid, {
      details,
      ...error.params,
    })
  }
}
