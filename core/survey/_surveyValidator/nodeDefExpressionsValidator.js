const R = require('ramda')

const Validator = require('@core/validation/validator')
const Validation = require('@core/validation/validation')
const ValidationResult = require('@core/validation/validationResult')
const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefExpression = require('@core/survey/nodeDefExpression')
const Expression = require('@core/expressionParser/expression')
const ObjectUtils = require('@core/objectUtils')

const SystemError = require('@core/systemError')

const _getNodeValue = nodeDef =>
  NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)
    ? { props: { code: '' } }
    : 1 //simulates node value

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const _getReachableNodeDefs = (survey, nodeDefContext) => {
  const reachableNodeDefs = []
  const visitorFn = nodeDef => {
    const nodeDefChildren = Survey.getNodeDefChildren(nodeDef)(survey)
    reachableNodeDefs.unshift(...nodeDefChildren)
  }
  Survey.visitAncestorsAndSelf(nodeDefContext, visitorFn)(survey)

  return reachableNodeDefs
}

const _getReachableNodeValue = (survey, nodeDefContext, nodeDefCurrent, nodeName) => {
  const reachableNodeDefs = _getReachableNodeDefs(survey, nodeDefContext)

  const def = reachableNodeDefs.find(x => NodeDef.getName(x) === nodeName)

  if (!def)
    throw new SystemError(
      Validation.messageKeys.expressions.unableToFindNode,
      { name: nodeName })
  if (!Expression.isValidExpressionType(def))
    throw new SystemError(
      Validation.messageKeys.expressions.unableToFindNode,
      { name: nodeName, type: NodeDef.getType(def) })
  if (Survey.isNodeDefDependentOn(NodeDef.getUuid(def), NodeDef.getUuid(nodeDefCurrent))(survey))
    throw new SystemError(
      Validation.messageKeys.expressions.circularDependencyError,
      { name: nodeName })

  return _getNodeValue(def)
}

const _identifierEval = (survey, nodeDefContext, nodeDef) => (expr, _ctx) => {
  const nodeName = R.prop('name')(expr)
  return _getReachableNodeValue(survey, nodeDefContext, nodeDef, nodeName)
}

const _validateNodeDefExpr = async (survey, nodeDefContext, nodeDef, expr) => {
  const functions = {
    [Expression.types.Identifier]: _identifierEval(survey, nodeDefContext, nodeDef)
  }

  try {
    // NB: `node` not needed here
    await Expression.evalString(expr, { functions })
    return null
  } catch (e) {
    const details = R.is(SystemError, e) ? `$t(${e.key})` : e.toString()
    return ValidationResult.newInstance(Validation.messageKeys.expressions.expressionInvalid, { details, ...e.params })
  }
}

const _validateExpressionProp = (survey, nodeDefContext, nodeDef) =>
  async (propName, item) => {
    const expr = R.pathOr(null, propName.split('.'), item)
    return expr ? await _validateNodeDefExpr(survey, nodeDefContext, nodeDef, expr) : null
  }

const _validateOnlyLastApplyIfEmpty = (nodeDefExpressions, i) =>
  async (propName, nodeDefExpression) => {
    const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
    return R.isEmpty(expr) && i < nodeDefExpressions.length - 1
      ? { key: Validation.messageKeys.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty }
      : null
  }

const _validateExpressionUniqueness = (nodeDefExpressions, nodeDefExpression) =>
  R.any(nodeDefExpr => !ObjectUtils.isEqual(nodeDefExpression)(nodeDefExpr) &&
    NodeDefExpression.getExpression(nodeDefExpr) === NodeDefExpression.getExpression(nodeDefExpression) &&
    NodeDefExpression.getApplyIf(nodeDefExpr) === NodeDefExpression.getApplyIf(nodeDefExpression)
  )(nodeDefExpressions)
    ? Validation.newInstance(false, {}, [{ key: Validation.messageKeys.nodeDefEdit.expressionDuplicate }])
    : null

const _validateExpression = async (survey, nodeDefContext, nodeDef, nodeDefExpressions, index, validateApplyIfUniqueness) => {
  const nodeDefExpression = nodeDefExpressions[index]
  const validation = await Validator.validate(
    nodeDefExpression,
    {
      [NodeDefExpression.keys.expression]: [
        Validator.validateRequired(Validation.messageKeys.nodeDefEdit.expressionRequired),
        _validateExpressionProp(survey, nodeDefContext, nodeDef)
      ],
      [NodeDefExpression.keys.applyIf]: [
        _validateExpressionProp(survey, nodeDefContext, nodeDef),
        ...validateApplyIfUniqueness
          ? [
            Validator.validateItemPropUniqueness(Validation.messageKeys.nodeDefEdit.applyIfDuplicate)(nodeDefExpressions),
            _validateOnlyLastApplyIfEmpty(nodeDefExpressions, index)
          ]
          : []
      ]
    }
  )
  return Validation.isValid(validation)
    ? _validateExpressionUniqueness(nodeDefExpressions, nodeDefExpression)
    : validation
}

const validate = async (survey, nodeDefContext, nodeDef, nodeDefExpressions, validateApplyIfUniqueness = true, errorKey = null) => {
  const result = Validation.newInstance()

  const validations = await Promise.all(
    nodeDefExpressions.map((nodeDefExpression, index) =>
      _validateExpression(survey, nodeDefContext, nodeDef, nodeDefExpressions, index, validateApplyIfUniqueness)
    )
  )

  validations.forEach((validation, index) => {
    Validation.setField(String(index), validation)(result)
    if (!Validation.isValid(validation))
      Validation.setValid(false)(result)
  })

  if (errorKey && !Validation.isValid(result))
    Validation.setErrors([{ key: errorKey }])(result)

  return result
}

module.exports = {
  validate,
}
