const R = require('ramda')
const jsep = require('jsep')
const Promise = require('bluebird')
const {isString} = require('../stringUtils')

const expressionTypes = {
  Literal: 'Literal',
  ThisExpression: 'ThisExpression',
  Identifier: 'Identifier',
  BinaryExpression: 'BinaryExpression',
  LogicalExpression: 'LogicalExpression',
  CallExpression: 'CallExpression',
  MemberExpression: 'MemberExpression',
}

const binaryExpression = async (expr, ctx) => {
  const {left, right, operator} = expr
  const leftResult = await evalExpression(left, ctx)
  const rightResult = await evalExpression(right, ctx)
  const x = `${JSON.stringify(leftResult)} ${operator} ${JSON.stringify(rightResult)}`
  console.log('=== BINARY')
  console.log(x)
  return eval(x)
}

const memberExpression = async (expr, ctx) => {
  console.log('== member')
  console.log(expr)

  const {object, property} = expr
  const {name} = property

  const res = await evalExpression(object, ctx)

  return isString(res)
    ? `${res}.${name}`
    : R.prop(name, res)
}

const callExpression = async (expr, ctx) => {
  console.log('== call')
  console.log(expr)

  const {callee, arguments} = expr

  const fn = await evalExpression(callee, ctx)
  const args = await Promise.all(
    arguments.map(async arg => await evalExpression(arg, ctx))
  )
  const res = R.apply(
    isString(fn)
      ? eval(fn)
      : fn,
    args
  )

  console.log('== CALLEE = RES ', res)
  return await res

}

const literalExpression = expr => {
  console.log('== literal ')
  console.log(expr)
  return R.prop('value')(expr)
}

const thisExpression = (expr, ctx) => {
  console.log('== this ')
  console.log(expr)
  //
  return 'this'
}

const identifierExpression = expr => {
  console.log('== identifierExpression ')
  console.log(expr)

  return R.prop('name')(expr)
}

const defaultFunctions = {
  [expressionTypes.LogicalExpression]: binaryExpression,
  [expressionTypes.BinaryExpression]: binaryExpression,
  [expressionTypes.Identifier]: identifierExpression,
  [expressionTypes.Literal]: literalExpression,
  [expressionTypes.ThisExpression]: thisExpression,
  [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.CallExpression]: callExpression,
}

const evalExpression = async (expr, ctx) => {
  const functions = R.pipe(
    R.prop('functions'),
    R.merge(defaultFunctions)
  )(ctx)

  return await functions[expr.type](expr, ctx)
}

const evalQuery = async (query, ctx) => {
  const expr = jsep(query)
  return await evalExpression(expr, ctx)
}

module.exports = {
  expressionTypes,
  evalExpression,
  evalQuery
}