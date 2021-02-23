import * as Expression from '@core/expressionParser/expression'

import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'

export const memberEval = (expr, ctx) => {
  const { object, property } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })
  if (objectEval === null) {
    return null
  }
  if (Expression.isIdentifier(property)) {
    const propertyName = Expression.getName(property)
    if (NodeNativeProperties.isNativePropertyAllowed({ nodeDef: objectEval, propertyName })) {
      // simulate node property getter
      return {}
    }
  } else if (Expression.isLiteral(property)) {
    // simulate access to element at index, but return only the node def
    return objectEval
  }
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}
