import * as Expression from '@core/expressionParser/expression'

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
  // eval property and return it (e.g. plot.plot_id)
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}
