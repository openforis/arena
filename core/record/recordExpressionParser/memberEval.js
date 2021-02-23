import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'

export const memberEval = (expr, ctx) => {
  const { object, property } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })

  if (objectEval) {
    if (Expression.isIdentifier(property)) {
      const propertyName = Expression.getName(property)
      if (NodeNativeProperties.isNativeProperty(propertyName)) {
        // property is a native property of the node
        return NodeNativeProperties.evalProperty({ node: objectEval, propertyName })
      }
    }
    // evaluate property moving the context node to the evaluated object
    const propertyEval = Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })

    if (Expression.isLiteral(property) && R.is(Array)(objectEval) && R.is(Number)(propertyEval)) {
      // property is the index of a multiple node
      return objectEval[propertyEval]
    }

    // property is a child of the "object" node
    return propertyEval
  }
  return null
}
