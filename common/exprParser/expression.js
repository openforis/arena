const R = require('ramda')

const jsep = require('./helpers/jsep')
const { evalExpression } = require('./helpers/expressionEvaluator')
const { types, toString: toStringUtils, isValid: isValidUtils } = require('./helpers/expressionUtils')

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
      R.replace(/>===/g, '>='),
      R.replace(/<===/g, '<='),
    )(string)

  return jsep(exprString)
}

const evalString = async (query, ctx) =>
  await evalExpression(fromString(query), ctx)

const isValid = isValidUtils

// ====== Type checking

const isType = type => R.propEq('type', type)

const isLiteral = isType(types.Literal)

// ====== Instance creators

const newLiteral = () => ({
  type: types.Literal,
  value: null,
  raw: '',
})

const newIdentifier = () => ({
  type: types.Identifier,
  name: ''
})

const newBinary = () => ({
  type: types.BinaryExpression,
  operator: '',
  left: newIdentifier(),
  right: newLiteral()

})

module.exports = {
  types,
  modes,

  toString,
  fromString,
  evalString,
  isValid,

  // Type checking
  isLiteral,

  // Instance creators
  newLiteral,
  newIdentifier,
  newBinary,
}