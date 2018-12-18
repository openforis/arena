const R = require('ramda')
const jsep = require('jsep')
const Promise = require('bluebird')
const {isString} = require('../stringUtils')

const unaryExpression = async (expr, ctx) => {
  const {argument, operator} = expr
  const res = await evalExpression(argument, ctx)
  const x = `${operator} ${JSON.stringify(res)}`
  // console.log('=== UNARY')
  // console.log(x)
  return eval(x)
}

const binaryExpression = async (expr, ctx) => {
  const {left, right, operator} = expr
  const leftResult = await evalExpression(left, ctx)
  const rightResult = await evalExpression(right, ctx)
  const x = `${JSON.stringify(leftResult)} ${operator} ${JSON.stringify(rightResult)}`
  // console.log('=== BINARY')
  // console.log(x)
  return eval(x)
}

const memberExpression = async (expr, ctx) => {
  // console.log('== member')
  // console.log(expr)

  const {object, property} = expr

  const objectRes = await evalExpression(object, ctx)
  const propertyRes = await evalExpression(property, ctx)

  return isString(objectRes)
    ? eval(`${objectRes}.${propertyRes}`)
    : R.prop(propertyRes, objectRes)
}

const callExpression = async (expr, ctx) => {
  // console.log('== call')
  // console.log(expr)

  // arguments is a reserved word in strict mode
  const {callee, arguments: exprArgs} = expr

  const fn = await evalExpression(callee, ctx)
  const args = await Promise.all(
    exprArgs.map(async arg => await evalExpression(arg, ctx))
  )
  const res = await R.apply(fn, args)

  console.log('== CALLEE = RES ', res)
  return res
}

const literalExpression = expr => {
  // console.log('== literal ')
  // console.log(expr)
  return R.prop('value')(expr)
}

const thisExpression = expr => {
  // console.log('== this ')
  // console.log(expr)
  //
  return 'this'
}

const identifierExpression = expr => {
  // console.log('== identifierExpression ')
  // console.log(expr)
  return R.prop('name')(expr)
}

const expressionTypes = {
  // 'Compound'
  Identifier: 'Identifier',
  MemberExpression: 'MemberExpression',
  Literal: 'Literal',
  ThisExpression: 'ThisExpression',
  CallExpression: 'CallExpression',
  UnaryExpression: 'UnaryExpression',
  BinaryExpression: 'BinaryExpression',
  LogicalExpression: 'LogicalExpression',
  // 'ConditionalExpression'
  // 'ArrayExpression'
}

const defaultFunctions = {
  [expressionTypes.Identifier]: identifierExpression,
  [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.Literal]: literalExpression,
  [expressionTypes.ThisExpression]: thisExpression,
  [expressionTypes.CallExpression]: callExpression,
  [expressionTypes.UnaryExpression]: unaryExpression,
  [expressionTypes.BinaryExpression]: binaryExpression,
  [expressionTypes.LogicalExpression]: binaryExpression,
}

const evalExpression = async (expr, ctx) => {
  const functions = R.pipe(
    R.prop('functions'),
    R.mergeLeft(defaultFunctions)
  )(ctx)

  console.log('functions',functions)
  console.log('ctx',ctx.functions)
  return await functions[expr.type](expr, ctx)
}

const evalQuery = async (query, ctx) => await evalExpression(jsep(query), ctx)

module.exports = {
  expressionTypes,
  evalExpression,
  evalQuery,
}