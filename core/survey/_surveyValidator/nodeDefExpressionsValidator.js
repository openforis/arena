const R = require('ramda')

const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')
const ValidationResult = require('../../validation/validationResult')
const Survey = require('../survey')
const NodeDef = require('../nodeDef')
const NodeDefExpression = require('../nodeDefExpression')
const Expression = require('../../exprParser/expression')
const ObjectUtils = require('../../objectUtils')

const SystemError = require('../../../server/utils/systemError')

const bindNode = (survey, nodeDef) => ({
  ...nodeDef,
  value: 1, //simulates node value
  //simulates node value
  getValue: () => NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef) ? { props: { code: '' } } : 1,
  parent: () => {
    const def = Survey.getNodeDefParent(nodeDef)(survey)
    if (!def) {
      const name = NodeDef.getName(nodeDef)
      throw new SystemError(Validation.messageKeys.expressions.unableToFindNodeParent, { name })
    }
    return bindNode(survey, def)
  },
  node: childName => {
    if (NodeDef.isEntity(nodeDef)) {
      const def = Survey.getNodeDefChildByName(nodeDef, childName)(survey)
      if (!def) {
        throw new SystemError(Validation.messageKeys.expressions.unableToFindNodeChild, { name: childName })
      }
      return bindNode(survey, def)
    } else {
      const parentName = NodeDef.getName(nodeDef)
      throw new SystemError(Validation.messageKeys.expressions.cannotGetChildOfAttribute, { childName, parentName })
    }
  },
  sibling: name => {
    const def = Survey.getNodeDefSiblingByName(nodeDef, name)(survey)
    if (!def) {
      throw new SystemError(Validation.messageKeys.expressions.unableToFindNodeSibling, { name })
    }
    return bindNode(survey, def)
  },
})

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  try {
    await Expression.evalString(
      expr,
      {
        node: bindNode(survey, nodeDef),
        functions: {
          [Expression.types.ThisExpression]: (expr, { node }) => node,
        },
      }
    )
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
