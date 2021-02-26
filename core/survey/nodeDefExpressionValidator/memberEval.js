import * as Expression from '@core/expressionParser/expression'

import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'

export const memberEval = (expr, ctx) => {
  const { object, property, computed } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })
  if (objectEval === null) {
    return null
  }
  if (computed) {
    // access element at index (e.g. plot[1] or plot[index(...)])
    return objectEval
  }
  if (Expression.isIdentifier(property)) {
    const propName = Expression.getName(property)
    if (NodeNativeProperties.hasNativeProperty({ nodeDef: objectEval, propName })) {
      return NodeNativeProperties.evalNodeDefProperty({ nodeDef: objectEval, propName })
    }
  }
  // eval property and return it (e.g. plot.plot_id)
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}
