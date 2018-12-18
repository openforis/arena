const R = require('ramda')

const Validator = require('../../common/validation/validator')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const {expressionTypes, evalQuery} = require('../../common/exprParser/exprParser')

const getExprCtx = (survey, nodeDef) => ({
  node: {
    ...nodeDef,
    parent: () => Survey.getNodeDefParent(nodeDef),
    node: name => Survey.getNodeDefChildByName(nodeDef, name)(survey),
    sibling: name => Survey.getNodeDefSiblingByName(nodeDef, name)
  },
  functions: {
    [expressionTypes.ThisExpression]: (expr, {node}) => console.log("=== node " , node ) || node
  },
})

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  try {
    await evalQuery(expr, getExprCtx(survey,nodeDef))
    return {
      valid: true
    }
  } catch (e) {
    console.log('errorrrrr')
    console.log(e)
    return {
      valid: false,
      errors: [e.toString()]
    }
  }
}
const validateExpressionProp = (survey, nodeDef) =>
  async (propName, item) => {
    const expr = R.pathOr('', propName.split('.'), item)
    const validation = await validateNodeDefExpr(survey, nodeDef, expr)
    return validation.valid
      ? null
      : validation.errors[0]
  }

const nodeDefExpressionPropsValidations = (survey, nodeDef) => ({
  'expression': [Validator.validateRequired, validateExpressionProp(survey, nodeDef)],
  'applyIf': [validateExpressionProp(survey, nodeDef)]
})

const validateExpression = async (survey, nodeDef, nodeDefExpression) =>
  await Validator.validate(nodeDefExpression, nodeDefExpressionPropsValidations(survey, nodeDef))

const validate = (survey, nodeDef) =>
  async (propName, item) => {
    const result = {fields: {}}

    const nodeDefExpressions = R.pathOr([], R.split('.', propName), item)
    nodeDefExpressions.forEach(async (nodeDefExpression, i) => {
      result.fields['' + i] = await validateExpression(survey, nodeDef, nodeDefExpression)
    })

    result.valid = R.pipe(
      R.values,
      R.none(v => !v.valid)
    )(result.fields)

    return result
  }

module.exports = {
  validate
}