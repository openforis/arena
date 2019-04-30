const R = require('ramda')

const jsep = require('./helpers/jsep')
const { evalExpression } = require('./helpers/evaluator')
const { toString: toStringUtils, isValid } = require('./helpers/utils')
const { types } = require('./helpers/types')

const operators = require('./helpers/operators')
const { toParamsObj, getWherePerparedStatement } = require('./helpers/sqlUtils')

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

// ====== Type checking

const isType = type => R.propEq('type', type)

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

const newBinary = (left, right, operator = '') => ({
  type: types.BinaryExpression,
  operator,
  left,
  right
})

module.exports = {
  types,
  modes,

  toString,
  fromString,
  evalString,
  isValid,

  // Type checking
  isLiteral: isType(types.Literal),
  isCompound: isType(types.Compound),
  isBinary: isType(types.BinaryExpression),
  isIdentifier: isType(types.Identifier),
  isLogical: isType(types.LogicalExpression),

  // Instance creators
  newLiteral,
  newIdentifier,
  newBinary,

  // operators
  operators,

  // Sql utils
  toParamsObj,
  getWherePerparedStatement,
}