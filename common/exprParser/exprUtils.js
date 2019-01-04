const R = require('ramda')

const {expressionTypes} = require('./exprParser')
const {trim, isNotBlank} = require('../stringUtils')

const propValid = prop => R.pipe(R.prop(prop), isNotBlank)
const binaryValid = node => isValid(node.left) && propValid('operator')(node) && isValid(node.right)

const fnsValid = {
  [expressionTypes.Identifier]: propValid('name'),
  // [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.Literal]: propValid('raw'),
  // [expressionTypes.ThisExpression]: thisExpression,
  // [expressionTypes.CallExpression]: callExpression,
  // [expressionTypes.UnaryExpression]: unaryExpression,
  [expressionTypes.BinaryExpression]: binaryValid,
  [expressionTypes.LogicalExpression]: binaryValid,
  // [expressionTypes.GroupExpression]: groupExpression,
}

const isValid = expr => {
  const fn = fnsValid[R.prop('type', expr)]
  return fn(expr)
}

const identifier = R.prop('name')
const literal = R.prop('raw')
const binary = node => `${toString(node.left)} ${node.operator} ${toString(node.right)}`

const fns = {
  [expressionTypes.Identifier]: identifier,
  // [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.Literal]: literal,
  // [expressionTypes.ThisExpression]: thisExpression,
  // [expressionTypes.CallExpression]: callExpression,
  // [expressionTypes.UnaryExpression]: unaryExpression,
  [expressionTypes.BinaryExpression]: binary,
  [expressionTypes.LogicalExpression]: binary,
  // [expressionTypes.GroupExpression]: groupExpression,
}

const toString = expr => {
  const fn = fns[R.prop('type', expr)]
  return trim(fn(expr))
}

module.exports = {
  toString,
  isValid,
}