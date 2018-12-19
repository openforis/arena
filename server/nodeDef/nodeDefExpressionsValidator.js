const R = require('ramda')
const Promise = require('bluebird')

const Validator = require('../../common/validation/validator')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const ExprParser = require('../../common/exprParser/exprParser')
const {expressionTypes} = ExprParser

const bindNode = (survey, nodeDef) => ({
  ...nodeDef,
  value: {}, //simulates node value
  parent: () => {
    const def = Survey.getNodeDefParent(nodeDef)(survey)
    if (!def) throw new Error('Unable to find parent of ' + NodeDef.getNodeDefName(nodeDef))
    return bindNode(survey, def)
  },
  node: name => {
    const def = Survey.getNodeDefChildByName(nodeDef, name)(survey)
    if (!def) throw new Error('Unable to find node with name ' + name)
    return bindNode(survey, def)
  },
  sibling: name => {
    const def = Survey.getNodeDefSiblingByName(nodeDef, name)(survey)
    if (!def) throw new Error('Unable to find sibling with name ' + name)
    return bindNode(survey, def)
  }
})

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  try {
    await ExprParser.evalQuery(
      expr,
      {
        node: bindNode(survey, nodeDef),
        functions: {
          [expressionTypes.ThisExpression]: (expr, {node}) => node
        },
      }
    )
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

const validate = async (survey, nodeDef, nodeDefExpressions) => {
  const result = {valid: true, fields: {}}

  const validations = await Promise.all(
    nodeDefExpressions.map(async nodeDefExpression =>
      await validateExpression(survey, nodeDef, nodeDefExpression)
    )
  )

  validations.forEach((validation, i) => {
    result.fields[i + ''] = validation
    result.valid = result.valid && validation.valid
  })

  return result
}

module.exports = {
  validate
}