const {expressionTypes, evalQuery} = require('../../common/exprParser/exprParser')

const rootNode = {id: 1, name: 'root'}
const newNode = name => ({id: 3, value: 18, name})

const bindNodeFunctions = (node) => ({
  ...node,
  parent: async () => node.id === 1 ? null : bindNodeFunctions(rootNode),
  node: async name => bindNodeFunctions(newNode(name)),
  sibling: async name => bindNodeFunctions(newNode(name)),
})

const evalNodeQuery = async (node, query) => {
  const ctx = {
    node: bindNodeFunctions(node),
    functions: {
      [expressionTypes.ThisExpression]: (expr, {node}) => node
    },
  }
  return await evalQuery(query, ctx)
}

module.exports = {
  evalNodeQuery,
}