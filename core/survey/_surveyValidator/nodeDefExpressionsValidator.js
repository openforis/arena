import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Expression from '@core/expressionParser/expression'
import * as ObjectUtils from '@core/objectUtils'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

const contextByDependencyTypeFns = {
  [Survey.dependencyTypes.defaultValues]: (survey, nodeDef) => nodeDef,
  [Survey.dependencyTypes.applicable]: (survey, nodeDef) => Survey.getNodeDefParent(nodeDef)(survey),
  [Survey.dependencyTypes.validations]: (survey, nodeDef) => nodeDef,
  [Survey.dependencyTypes.formula]: (survey, nodeDef) => nodeDef,
}

const expressionsByDependencyTypeFns = {
  [Survey.dependencyTypes.defaultValues]: NodeDef.getDefaultValues,
  [Survey.dependencyTypes.applicable]: NodeDef.getApplicable,
  [Survey.dependencyTypes.validations]: R.pipe(NodeDef.getValidations, NodeDefValidations.getExpressions),
  [Survey.dependencyTypes.formula]: NodeDef.getFormula,
}

const selfReferenceAllowedByDependencyType = {
  [Survey.dependencyTypes.defaultValues]: false,
  [Survey.dependencyTypes.applicable]: false,
  [Survey.dependencyTypes.validations]: true,
  [Survey.dependencyTypes.formula]: false,
}

const applyIfUniquenessByDependencyType = {
  [Survey.dependencyTypes.defaultValues]: true,
  [Survey.dependencyTypes.applicable]: false,
  [Survey.dependencyTypes.validations]: false,
  [Survey.dependencyTypes.formula]: false,
}

const errorKeyByDependencyType = {
  [Survey.dependencyTypes.defaultValues]: Validation.messageKeys.nodeDefEdit.defaultValuesInvalid,
  [Survey.dependencyTypes.applicable]: Validation.messageKeys.nodeDefEdit.applyIfInvalid,
  [Survey.dependencyTypes.validations]: Validation.messageKeys.nodeDefEdit.validationsInvalid,
  [Survey.dependencyTypes.formula]: Validation.messageKeys.nodeDefEdit.formulaInvalid,
}

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

const _identifierEval = (survey, nodeDefCurrent, dependencyType) => (expr) => {
  const nodeDefContext = contextByDependencyTypeFns[dependencyType](survey, nodeDefCurrent)
  const selfReferenceAllowed = selfReferenceAllowedByDependencyType[dependencyType]

  const reachableNodeDefs = _getReachableNodeDefs(survey, nodeDefContext)

  const nodeName = R.prop('name')(expr)
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

  return _getNodeValue(def)
}

const _validateNodeDefExpr = async (survey, nodeDef, dependencyType, expr) => {
  const functions = {
    [Expression.types.Identifier]: _identifierEval(survey, nodeDef, dependencyType),
  }

  try {
    // NB: `node` not needed here
    await Expression.evalString(expr, { functions })
    return null
  } catch (error) {
    const details = R.is(SystemError, error) ? `$t(${error.key})` : error.toString()
    return ValidationResult.newInstance(Validation.messageKeys.expressions.expressionInvalid, {
      details,
      ...error.params,
    })
  }
}

const _validateExpressionProp = (survey, nodeDef, dependencyType) => async (propName, item) => {
  const expr = R.pathOr(null, propName.split('.'), item)
  return expr ? _validateNodeDefExpr(survey, nodeDef, dependencyType, expr) : null
}

const _validateOnlyLastApplyIfEmpty = (nodeDefExpressions, i) => async (propName, nodeDefExpression) => {
  const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
  return R.isEmpty(expr) && i < nodeDefExpressions.length - 1
    ? {
        key: Validation.messageKeys.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty,
      }
    : null
}

const _validateExpressionUniqueness = (nodeDefExpressions, nodeDefExpression) =>
  R.any(
    (nodeDefExpr) =>
      !ObjectUtils.isEqual(nodeDefExpression)(nodeDefExpr) &&
      NodeDefExpression.getExpression(nodeDefExpr) === NodeDefExpression.getExpression(nodeDefExpression) &&
      NodeDefExpression.getApplyIf(nodeDefExpr) === NodeDefExpression.getApplyIf(nodeDefExpression)
  )(nodeDefExpressions)
    ? Validation.newInstance(false, {}, [{ key: Validation.messageKeys.nodeDefEdit.expressionDuplicate }])
    : null

const _validateExpression = async (survey, nodeDef, dependencyType, nodeDefExpressions, index) => {
  const nodeDefExpression = nodeDefExpressions[index]
  const validateApplyIfUniqueness = applyIfUniquenessByDependencyType[dependencyType]

  const validation = await Validator.validate(nodeDefExpression, {
    [NodeDefExpression.keys.expression]: [
      Validator.validateRequired(Validation.messageKeys.nodeDefEdit.expressionRequired),
      _validateExpressionProp(survey, nodeDef, dependencyType),
    ],
    [NodeDefExpression.keys.applyIf]: [
      _validateExpressionProp(survey, nodeDef, dependencyType),
      ...(validateApplyIfUniqueness
        ? [
            Validator.validateItemPropUniqueness(Validation.messageKeys.nodeDefEdit.applyIfDuplicate)(
              nodeDefExpressions
            ),
            _validateOnlyLastApplyIfEmpty(nodeDefExpressions, index),
          ]
        : []),
    ],
  })

  return Validation.isValid(validation)
    ? _validateExpressionUniqueness(nodeDefExpressions, nodeDefExpression)
    : validation
}

export const validate = async (survey, nodeDef, dependencyType) => {
  const result = Validation.newInstance()

  const nodeDefExpressions = expressionsByDependencyTypeFns[dependencyType](nodeDef)
  const errorKey = errorKeyByDependencyType[dependencyType]

  const validations = await Promise.all(
    nodeDefExpressions.map((nodeDefExpression, index) =>
      _validateExpression(survey, nodeDef, dependencyType, nodeDefExpressions, index)
    )
  )

  validations.forEach((validation, index) => {
    Validation.setField(String(index), validation)(result)
    if (!Validation.isValid(validation)) {
      Validation.setValid(false)(result)
    }
  })

  if (!Validation.isValid(result)) {
    Validation.setErrors([{ key: errorKey }])(result)
  }

  return result
}
