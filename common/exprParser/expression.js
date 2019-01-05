const R = require('ramda')

const jsep = require('./helpers/jsep')
const {evalExpression} = require('./helpers/expressionEvaluator')
const {types, toString: toStringUtils, isValid: isValidUtils} = require('./helpers/expressionUtils')

const modes = {
  json: 'json',
  sql: 'sql',
}

const toString = (expr, exprMode = modes.json) => {
  const string = toStringUtils(expr)

  return exprMode === modes.sql
    ? R.pipe(
      R.replace(/&&/g, 'AND'),
      R.replace(/\|\|/g, 'OR'),
      R.replace(/===/g, '='),
      R.replace(/!==/g, '!='),
    )(string)
    : string
}

const fromString = (string, exprMode = modes.json) => {
  const exprString = exprMode === modes.json ?
    string :
    R.pipe(
      R.replace(/AND/g, '&&'),
      R.replace(/OR/g, '||'),
      R.replace(/=/g, '==='),
      R.replace(/!===/g, '!=='),
    )(string)

  return jsep(exprString)
}

const evalString = async (query, ctx) =>
  await evalExpression(fromString(query), ctx)

const isValid = isValidUtils

module.exports = {
  types,
  modes,

  toString,
  fromString,
  evalString,
  isValid,
}