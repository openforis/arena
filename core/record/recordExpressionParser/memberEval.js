import * as Expression from '@core/expressionParser/expression'

import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'

export const memberEval = (expr, ctx) => {
  const { object, property, computed } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })
  if (!objectEval) {
    return null
  }
  if (!computed && Expression.isIdentifier(property)) {
    const propertyName = Expression.getName(property)
    if (NodeNativeProperties.isNativeProperty(propertyName)) {
      // property is a native property of the node
      return NodeNativeProperties.evalProperty({ node: objectEval, propertyName })
    }
  }

  if (computed) {
    // property is the index of a multiple node
    const propertyEval = Expression.evalExpr({ expr: property, ctx })
    return objectEval[propertyEval]
  }
  // property is a child of the "object" node
  // evaluate property moving the context node to the evaluated object
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}
