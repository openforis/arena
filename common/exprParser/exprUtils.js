const R = require('ramda')

const jsep = require('./jsep')
const {expressionTypes, evalExpression} = require('./exprParser')
const {trim, isNotBlank} = require('../stringUtils')

const mode = {
  json: 'json',
  sql: 'sql',
}

// toString
const binaryToString = node => `${toString(node.left)} ${node.operator} ${toString(node.right)}`
// valid
const propValid = prop => R.pipe(R.prop(prop), isNotBlank)
const binaryValid = node => isValid(node.left) && propValid('operator')(node) && isValid(node.right)

const settings = {
  [expressionTypes.Identifier]: {
    toString: R.prop('name'),
    isValid: propValid('name'),
  },
  // [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.Literal]: {
    toString: R.prop('raw'),
    isValid: propValid('raw'),
  },
  [expressionTypes.ThisExpression]: {
    toString: () => 'this',
    isValid: () => true,
  },
  // [expressionTypes.CallExpression]: { toString: callExpression,
  //   },
  [expressionTypes.UnaryExpression]: {
    toString: node => `${node.operator} ${toString(node.argument)}`,
    isValid: node => propValid('operator')(node) && isValid(node.argument),
  },
  [expressionTypes.BinaryExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [expressionTypes.LogicalExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [expressionTypes.GroupExpression]: {
    toString: node => `(${toString(node.argument)})`,
    isValid: node => isValid(node.argument),
  },
}

const toString = (expr, exprMode = mode.json) => {
  const fn = R.path([expr.type, 'toString'], settings)
  const string = trim(fn(expr))

  return exprMode === mode.sql
    ? R.pipe(
      R.replace(/&&/g, 'AND'),
      R.replace(/\|\|/g, 'OR'),
      R.replace(/===/g, '='),
      R.replace(/!==/g, '!='),
    )(string)
    : string
}

const isValid = expr => {
  const fn = R.path([expr.type, 'isValid'], settings)
  return fn(expr)
}

const fromString = (string, mode = mode.json) => {
  const exprString = mode === mode.json
    ? string
    : R.pipe(
      R.replace(/AND/g, '&&'),
      R.replace(/OR/g, '||'),
      R.replace(/=/g, '==='),
      R.replace(/!===/g, '!=='),
    )(string)
  return jsep(exprString)
}

const evalString = async (query, ctx) => await evalExpression(fromString(query), ctx)

module.exports = {
  mode,

  toString,
  isValid,
  fromString,
  evalString,
}