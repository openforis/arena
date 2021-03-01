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
  // allow self node def reference because the referenced node at runtime can be different from current node
  // e.g. current node = plot_id ; expression = parent(plot).plot[index(plot) - 1].plot_id
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval, selfReferenceAllowed: true } })
}
