const R = require('ramda')

const NodeDef = require('@core/survey/nodeDef')

const jsep = require('./helpers/jsep')
const Evaluator = require('./helpers/evaluator')
const ExpressionUtils = require('./helpers/utils')
const types = require('./helpers/types')
const operators = require('./helpers/operators')

const modes = {
  json: 'json',
  sql: 'sql',
}

const toString = (expr, exprMode = modes.json) => {
  const string = ExpressionUtils.toString(expr)

  return exprMode === modes.sql
    ? R.pipe(
      R.replace(/&&/g, 'AND'),
      R.replace(/\|\|/g, 'OR'),
      R.replace(/==/g, '='),
      R.replace(/!=/g, '!='),
    )(string)
    : string
}

const fromString = (string, exprMode = modes.json) => {
  const exprString = exprMode === modes.json ?
    string :
    R.pipe(
      R.replace(/AND/g, '&&'),
      R.replace(/OR/g, '||'),
      R.replace(/=/g, '=='),
      R.replace(/!==/g, '!='),
      R.replace(/>==/g, '>='),
      R.replace(/<==/g, '<='),
    )(string)

  return jsep(exprString)
}

const evalString = (query, ctx) => Evaluator.evalExpression(fromString(query), ctx)

// ====== Type checking

const isType = type => R.propEq('type', type)

// ====== Instance creators

const newLiteral = (value = null) => ({
  type: types.Literal,
  value: value,
  raw: value || '',
})

const newIdentifier = (value = '') => ({
  type: types.Identifier,
  name: value,
})

const newBinary = (left, right, operator = '') => ({
  type: types.BinaryExpression,
  operator,
  left,
  right,
})

// Return true if the nodeDef can be used in expressions and false otherwise
const isValidExpressionType = nodeDef =>
  !NodeDef.isEntity(nodeDef)
  && !NodeDef.isCoordinate(nodeDef)
  && !NodeDef.isFile(nodeDef)

module.exports = {
  types,
  modes,

  toString,
  fromString,
  evalString,
  isValid: ExpressionUtils.isValid,
  getExpressionIdentifiers: Evaluator.getExpressionIdentifiers,

  // Type checking
  isLiteral: isType(types.Literal),
  isCompound: isType(types.Compound),
  isBinary: isType(types.BinaryExpression),
  isIdentifier: isType(types.Identifier),
  isLogical: isType(types.LogicalExpression),
  isValidExpressionType,

  // Instance creators
  newLiteral,
  newIdentifier,
  newBinary,

  // operators
  operators,
}