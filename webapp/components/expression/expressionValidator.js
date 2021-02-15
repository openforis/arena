import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

const functions = ({ variablesGrouped }) => ({
  [Expression.types.Identifier]: (_expr, { node: contextGroup }) => {
    const childName = Expression.getName(_expr)
    const variablesGroup = variablesGrouped.find((group) => group.label === contextGroup?.label)
    const variable = variablesGroup?.options?.find((variableInGroup) => variableInGroup.label === childName)
    if (!variable) {
      throw new Error(`Unknown variable: ${childName}`)
    }
    return variable
  },
  [Expression.types.MemberExpression]: (_expr, ctx) => {
    const { object, property } = _expr

    const objectEval = Expression.evalExpr({ expr: object, ctx })
    if (!R.isNil(objectEval)) {
      const propertyName = Expression.getName(property)
      if (Expression.isNodeProperty(propertyName)) {
        // e.g. entity.nested_entities.length
        // simulate property getter
        return {}
      }
      if (Expression.isLiteral(property)) {
        // e.g. entity[index]
        return objectEval
      }
      if (Expression.isIdentifier(property)) {
        // e.g. entity.attribute
        // change context to current node when evaluating property expression
        return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
      }
    }
    return null
  },
})

export const validateExpression = ({ variablesGrouped, exprString, mode }) => {
  try {
    const expr = Expression.fromString(exprString, mode)
    const rootVariable = variablesGrouped.find((group) => group.root)

    // try to evaluate the expression
    Expression.evalExpr({ expr, ctx: { functions: functions({ variablesGrouped }), node: rootVariable } })

    const canBeConstant = true // Name the param
    return { ok: Expression.isValid(expr, canBeConstant) }
  } catch (error) {
    return { error: 'syntaxError', message: error.message }
  }
}
