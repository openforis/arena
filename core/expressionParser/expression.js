import * as R from 'ramda'

import { JavascriptExpressionParser } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import * as ExpressionConstants from './expressionConstants'
import * as ExpressionUtils from './helpers/utils'

import { types } from './helpers/types'

const { modes, thisVariable, contextVariable } = ExpressionConstants
export { modes, thisVariable, contextVariable }

export { types } from './helpers/types'
export { operators } from './helpers/operators'
export { functionNames } from './helpers/functions'
export { toSql } from './toSql'

export const getName = R.prop('name')

export const toString = (expr, exprMode = modes.json) => {
  const string = ExpressionUtils.toString(expr)

  return exprMode === modes.sql
    ? R.pipe(R.replace(/&&/g, 'AND'), R.replace(/\|\|/g, 'OR'), R.replace(/==/g, '='), R.replace(/"/g, `'`))(string)
    : string
}

export const fromString = (string, exprMode = modes.json) => {
  const exprString =
    exprMode === modes.json
      ? string
      : R.pipe(
          R.replace(/AND/g, '&&'),
          R.replace(/OR/g, '||'),
          R.replace(/=+/g, '=='),
          R.replace(/!==/g, '!='),
          R.replace(/>==/g, '>='),
          R.replace(/<==/g, '<=')
        )(string)

  return new JavascriptExpressionParser().parse(exprString)
}

export const { isValid } = ExpressionUtils

// ====== Type checking

export const getType = R.prop('type')
const isType = (type) => R.propEq('type', type)

// Return true if the nodeDef can be used in expressions and false otherwise
export const isValidExpressionType = (nodeDef) => !NodeDef.isFile(nodeDef)

export const isBinary = isType(types.BinaryExpression)
export const isCall = isType(types.CallExpression)
export const isCompound = isType(types.Compound)
export const isIdentifier = isType(types.Identifier)
export const isLiteral = isType(types.Literal)
export const isSequence = isType(types.SequenceExpression)
export const isThis = isType(types.ThisExpression)

// ====== Instance creators

export const newLiteral = (value = null) => ({
  type: types.Literal,
  value,
  raw: value ?? '',
})

export const newIdentifier = (value = '') => ({
  type: types.Identifier,
  name: value,
})

export const newBinary = ({ left, right, operator = '' }) => ({
  type: types.BinaryExpression,
  operator,
  left,
  right,
})

export const newBinaryEmpty = ({ canBeConstant, exprQuery = null }) => {
  let left = null
  if (isCompound(exprQuery)) {
    left = canBeConstant ? newLiteral() : newIdentifier()
  } else {
    left = exprQuery
  }
  return newBinary({ left, right: newLiteral() })
}

export const newCall = ({ callee, params = [] } = {}) => ({
  type: types.CallExpression,
  callee: newLiteral(callee),
  arguments: params,
})
