const R = require('ramda')
const Promise = require('bluebird')

const Validator = require('../../common/validation/validator')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefExpression = require('../../common/survey/nodeDefExpression')
const Expression = require('../../common/exprParser/expression')

const bindNode = (survey, nodeDef) => ({
  ...nodeDef,
  value: 1, //simulates node value
  getValue: () => 1, //simulates node value
  parent: () => {
    const def = Survey.getNodeDefParent(nodeDef)(survey)
    if (!def) throw new Error('Unable to find parent of ' + NodeDef.getNodeDefName(nodeDef))
    return bindNode(survey, def)
  },
  node: name => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const def = Survey.getNodeDefChildByName(nodeDef, name)(survey)
      if (!def) throw new Error('Unable to find node with name ' + name)
      return bindNode(survey, def)
    } else {
      throw new Error(`Cannot get child '${name}' from attribute ${NodeDef.getNodeDefName(nodeDef)}`)
    }
  },
  sibling: name => {
    const def = Survey.getNodeDefSiblingByName(nodeDef, name)(survey)
    if (!def) throw new Error('Unable to find sibling with name ' + name)
    return bindNode(survey, def)
  }
})

const validateNodeDefExpr = async (survey, nodeDef, expr) => {
  try {
    await Expression.evalString(
      expr,
      {
        node: bindNode(survey, nodeDef),
        functions: {
          [Expression.types.ThisExpression]: (expr, { node }) => node
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
    return expr ? await validateNodeDefExpr(survey, nodeDef, expr) : null
  }

const validateOnlyLastApplyIfEmpty = (nodeDefExpressions, i) =>
  async (propName, nodeDefExpression) => {
    const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
    return R.isEmpty(expr) && i < nodeDefExpressions.length - 1
      ? 'only_last_can_have_empty_apply_if'
      : null
  }

const validateExpression = async (survey, nodeDef, nodeDefExpressions, i) => {
  const nodeDefExpression = nodeDefExpressions[i]
  const validation = await Validator.validate(
    nodeDefExpression,
    {
      [NodeDefExpression.keys.expression]: [Validator.validateRequired, validateExpressionProp(survey, nodeDef)],
      [NodeDefExpression.keys.applyIf]: [
        validateExpressionProp(survey, nodeDef),
        Validator.validateItemPropUniqueness(nodeDefExpressions),
        validateOnlyLastApplyIfEmpty(nodeDefExpressions, i)
      ]
    }
  )
  return validation
}

const validate = async (survey, nodeDef, nodeDefExpressions) => {
  const result = { valid: true, fields: {} }
  const range = R.range(0, nodeDefExpressions.length)

  const validations = await Promise.all(
    range.map(async i =>
      await validateExpression(survey, nodeDef, nodeDefExpressions, i)
    )
  )

  validations.forEach((validation, i) => {
    result.fields[i + ''] = validation
    result.valid = result.valid && (!validation || validation.valid)
  })

  return result
}

module.exports = {
  validate
}
