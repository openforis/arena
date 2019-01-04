const R = require('ramda')

const {expressionTypes} = require('./exprParser')
const {trim} = require('../stringUtils')

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
}