const R = require('ramda')

const Validator = require('../../common/validation/validator')
const Survey = require('../../common/survey/survey')
const {expressionTypes, evalQuery} = require('../../common/exprParser/exprParser')

const getExprCtx = (survey, nodeDef) => ({
  node: {
    ...nodeDef,
    parent: () => Survey.getNodeDefParent(nodeDef)(survey),
    node: name => Survey.getNodeDefChildByName(nodeDef, name)(survey),
    sibling: name => Survey.getNodeDefSiblingByName(nodeDef, name)(survey)
  },
  functions: {
    [expressionTypes.ThisExpression]: (expr, {node}) => node
  },
})

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  try {
    await evalQuery(expr, getExprCtx(survey, nodeDef))
    return null
  } catch (e) {
    return e.toString()
  }
}
const validateExpressionProp = (survey, nodeDef) =>
  async (propName, item) => {
    const expr = R.pathOr(null, propName.split('.'), item)
    const errorMsg = expr ? await validateNodeDefExpr(survey, nodeDef, expr) : null
    return errorMsg
  }

const validateExpression = async (survey, nodeDef, nodeDefExpression) =>
  await Validator.validate(
    nodeDefExpression,
    {
      'expression': [Validator.validateRequired, validateExpressionProp(survey, nodeDef)],
      'applyIf': [validateExpressionProp(survey, nodeDef)]
    }
  )

const validate = (survey, nodeDef, nodeDefExpressions) => {
  const result = {fields: {}}
  nodeDefExpressions.forEach(async (nodeDefExpression, i) =>
    result.fields['' + i] = await validateExpression(survey, nodeDef, nodeDefExpression)
  )

  result.valid = R.pipe(
    R.values,
    R.none(v => !v.valid)
  )(result.fields)

  return result
}

module.exports = {
  validate
}