const Expression = require('../../common/exprParser/expression')

const evalNodeQuery = async (node, query) => {
  const ctx = {
    node,
    functions: {
      [Expression.types.ThisExpression]: (expr, {node}) => node
    },
  }
  return await Expression.evalString(query, ctx)
}

module.exports = {
  evalNodeQuery,
}