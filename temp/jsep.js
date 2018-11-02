const jsep = require('jsep')
const R = require('ramda')

const expressionTypes = {
  Literal: 'Literal',
  ThisExpression: 'ThisExpression',
  Identifier: 'Identifier',
  BinaryExpression: 'BinaryExpression',
  LogicalExpression: 'LogicalExpression',
  CallExpression: 'CallExpression',
  MemberExpression: 'MemberExpression',
}

const evalExpression = (expr, ctx) => expressionFunctions[expr.type](expr, ctx)

const binaryExpression = (expr, ctx) => {
  const {left, right, operator} = expr
  const leftResult = evalExpression(left, ctx)
  const rightResult = evalExpression(right, ctx)
  const x = `${JSON.stringify(leftResult)} ${operator} ${JSON.stringify(rightResult)}`
  console.log('=== BINARY')
  console.log(x)
  return eval(x)
}

const memberExpression = (expr, ctx) => {
  console.log('== member')
  console.log(expr)

  const {object, property} = expr
  const {name} = property

  const res = evalExpression(object, ctx)

  return typeof  res === 'string' ? `${res}.${name}` : R.prop(name, res)
}

const callExpression = (expr, ctx) => {
  console.log('== call')
  console.log(expr)

  const {callee, arguments} = expr

  const fn = evalExpression(callee, ctx)
  const args = arguments.map(arg => evalExpression(arg, ctx))
  const res = R.apply(
    typeof fn === 'string' ? eval(fn) : fn,
    args
  )

  console.log('== CALLEE = RES ', res)
  return res

}

const literalExpression = expr => {
  console.log('== literal ')
  console.log(expr)
  return R.prop('value')(expr)
}

const thisExpression = (expr, {node}) => {
  console.log('== this ')
  console.log(expr)
  //
  return node
}

const identifierExpression = expr => {
  console.log('== identifierExpression ')
  console.log(expr)

  return R.prop('name')(expr)
}

const expressionFunctions = {
  [expressionTypes.LogicalExpression]: binaryExpression,
  [expressionTypes.BinaryExpression]: binaryExpression,
  [expressionTypes.Identifier]: identifierExpression,
  [expressionTypes.Literal]: literalExpression,
  [expressionTypes.ThisExpression]: thisExpression,
  [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.CallExpression]: callExpression,
}

// =======
// Test nodes
// =======

const rootNode = {id: 1, name: 'root'}
const node = {id: 2, value: 12, name: 'tree'}
const newNode = name => ({id: 3, value: 18, name})

const bindNodeFunctions = (node) => ({
  ...node,
  parent: () => node.id === 1 ? null : bindNodeFunctions(rootNode),
  node: name => bindNodeFunctions(newNode(name)),
  sibling: name => bindNodeFunctions(newNode(name)),
})

const main = () => {

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

  const query = '(this.sibling("dbh").value * 0.5) >= Math.pow(this.value, 3)'
  // 18 * 0.5 >= 1728

  const expr = jsep(query)
  const result = evalExpression(expr, {node: bindNodeFunctions(node)})

  console.log('========== RESULT')
  console.log(result)
}

main()
