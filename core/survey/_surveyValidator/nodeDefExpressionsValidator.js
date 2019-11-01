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
const _getReachableNodeDefs = (survey, nodeDef) => {
  const visibleNodes = []
  const visitorFn = nodeDef => {
    const nodeDefChildren = Survey.getNodeDefChildren(nodeDef)(survey)
    visibleNodes.unshift(...nodeDefChildren)
  }
  Survey.visitAncestorsAndSelf(nodeDef, visitorFn)(survey)
  return visibleNodes
}

const _getReachableNodeValue = (survey, nodeDef, nodeName) => {
  const allNodeDefs = _getReachableNodeDefs(survey, nodeDef)
  const def = allNodeDefs.filter(x => NodeDef.getName(x) === nodeName)[0]

  if (!def)
    throw new SystemError(
      Validation.messageKeys.expressions.unableToFindNode,
      { name: nodeName } )
  if (!Expression.isValidExpressionType(def))
    throw new SystemError(
      Validation.messageKeys.expressions.unableToFindNode,
      { name: nodeName, type: NodeDef.getType(def) } )

  return _getNodeValue(def)
}

const _identifierEval = (survey, nodeDef) => (expr, _ctx) => {
  const nodeName = R.prop('name')(expr)
  return _getReachableNodeValue(survey, nodeDef, nodeName)
}

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  const functions = {
    [Expression.types.Identifier]: _identifierEval(survey, nodeDef)
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

const validateExpressionProp = (survey, nodeDef) =>
  async (propName, item) => {
    const expr = R.pathOr(null, propName.split('.'), item)
    return expr ? await validateNodeDefExpr(survey, nodeDef, expr) : null
  }

const validateOnlyLastApplyIfEmpty = (nodeDefExpressions, i) =>
  async (propName, nodeDefExpression) => {
    const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
    return R.isEmpty(expr) && i < nodeDefExpressions.length - 1
      ? { key: Validation.messageKeys.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty }
      : null
  }

const validateExpressionUniqueness = (nodeDefExpressions, nodeDefExpression) =>
  R.any(nodeDefExpr => !ObjectUtils.isEqual(nodeDefExpression)(nodeDefExpr) &&
    NodeDefExpression.getExpression(nodeDefExpr) === NodeDefExpression.getExpression(nodeDefExpression) &&
    NodeDefExpression.getApplyIf(nodeDefExpr) === NodeDefExpression.getApplyIf(nodeDefExpression)
  )(nodeDefExpressions)
    ? Validation.newInstance(false, {}, [{ key: Validation.messageKeys.nodeDefEdit.expressionDuplicate }])
    : null

const validateExpression = async (survey, nodeDef, nodeDefExpressions, i, validateApplyIfUniqueness) => {
  const nodeDefExpression = nodeDefExpressions[i]
  const validation = await Validator.validate(
    nodeDefExpression,
    {
      [NodeDefExpression.keys.expression]: [
        Validator.validateRequired(Validation.messageKeys.nodeDefEdit.expressionRequired),
        validateExpressionProp(survey, nodeDef)
      ],
      [NodeDefExpression.keys.applyIf]: [
        validateExpressionProp(survey, nodeDef),
        ...validateApplyIfUniqueness
          ? [
            Validator.validateItemPropUniqueness(Validation.messageKeys.nodeDefEdit.applyIfDuplicate)(nodeDefExpressions),
            validateOnlyLastApplyIfEmpty(nodeDefExpressions, i)
          ]
          : []
      ]
    }
  )
  return Validation.isValid(validation)
    ? validateExpressionUniqueness(nodeDefExpressions, nodeDefExpression)
    : validation
}

const validate = async (survey, nodeDef, nodeDefExpressions, validateApplyIfUniqueness = true, errorKey = null) => {
  const result = Validation.newInstance()

  const validations = await Promise.all(
    nodeDefExpressions.map((nodeDefExpression, i) =>
      validateExpression(survey, nodeDef, nodeDefExpressions, i, validateApplyIfUniqueness)
    )
  )

  validations.forEach((validation, i) => {
    Validation.setField('' + i, validation)(result)
    Validation.setValid(Validation.isValid(result) && Validation.isValid(validation))(result)
  })

  if (errorKey && !Validation.isValid(result))
    Validation.setErrors([{ key: errorKey }])(result)

  return result
}

module.exports = {
  validate,
}
