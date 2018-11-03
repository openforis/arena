const R = require('ramda')

const {expressionTypes, evalQuery} = require('../../common/exprParser/exprParser')

const expressionFunctions = {
  [expressionTypes.ThisExpression]: (expr, {node}) => {
    console.log('== this ')
    console.log(expr)
    //
    return node
  },
}

const rootNode = {id: 1, name: 'root'}
const newNode = name => ({id: 3, value: 18, name})

const bindNodeFunctions = (node) => ({
  ...node,
  parent: async () => node.id === 1 ? null : bindNodeFunctions(rootNode),
  node: async name => bindNodeFunctions(newNode(name)),
  sibling: async name => bindNodeFunctions(newNode(name)),
})

const validateNode = async node => {
// get query
// const query = '1 + 1'
  // 2

  // const query = 'this.value + 1'
  // 12 + 1

  // const query = 'this.parent()'
  //{id: 1, name: 'root'}

  // const query = 'this.node("dbh")'
  // {id: 3, value: 18, name:'dbh'}

  // const query = 'this.parent().node("dbh").value + 1'
  //18 + 1

  // const query = 'this.parent().node("dbh").value + 1 + this.value'
  //18 + 1 + 12

  // const query = 'this.sibling("dbh").value + this.value'
  //18 + 12

  // const query = 'this.parent().node("dbh").value + 1 >= this.value'
  //19 >= 12

  // const query = '(this.sibling("dbh").value * 0.5) >= this.value'
  //18 * 0.5 >= 12

  // const query = 'Math.pow(this.value, 3)'
  //1728

  const query = '(this.sibling("dbh").value * 0.5) >= Math.pow(this.value, 3)'
  // 18 * 0.5 >= 1728

  const result = await evalQuery(query, {
    node: bindNodeFunctions(node),
    functions: expressionFunctions,
  })
  return result
}

module.exports = {
  validateNode,
}