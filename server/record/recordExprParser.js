const {expressionTypes, evalQuery} = require('../../common/exprParser/exprParser')

const evalNodeQuery = async (node, query) => {
  const ctx = {
    node,
    functions: {
      [expressionTypes.ThisExpression]: (expr, {node}) => node
    },
  }
  return await evalQuery(query, ctx)
}

module.exports = {
  evalNodeQuery,
}