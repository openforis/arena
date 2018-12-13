const R = require('ramda')

const Validator = require('../../common/validation/validator')

const ExprParser = require('../../common/exprParser/exprParser')

const getProp = (propName, item) => R.pathOr('', propName.split('.'), item)

const validateExpressionProp = async (propName, item) =>
  await validateExpression(getProp(propName, item))

const validateExpression = async expr => {
  const validation = ExprParser.validateExpression(expr)
  return validation.valid ? null : validation.errors[0]
}

const propsValidations = {
  'expression': [Validator.validateRequired, validateExpressionProp],
  'applyIf': [validateExpressionProp]
}

const validate = async nodeDefExpression =>
  await Validator.validate(nodeDefExpression, propsValidations)

const validateMultiple = async nodeDefExpressions => {
  const result = {fields: {}}

  for (let i = 0; i < nodeDefExpressions.length; i++) {
    const nodeDefExpression = nodeDefExpressions[i]
    result.fields['' + i] = await validate(nodeDefExpression)
  }

  result.valid = R.pipe(
    R.values,
    R.none(v => !v.valid)
  )(result.fields)

  return result
}

module.exports = {
  validateMultiple
}