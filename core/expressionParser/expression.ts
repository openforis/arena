import * as A from '@core/arena'

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

export const getName = A.prop('name') as (expr: { name?: string }) => string | undefined

// single or double quoted strings (with escaped chars)
const quotedStringRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/

// applies the replace function only to the parts of the string outside quoted strings (literal values)
const _replaceOutsideQuotes = (string: string, replaceFn: (part: string) => string): string =>
  string
    .split(quotedStringRegex)
    .map((part, index) => (index % 2 === 0 ? replaceFn(part) : part))
    .join('')

const _jsToSqlOperators = (part: string): string =>
  part.replaceAll('&&', 'AND').replaceAll('||', 'OR').replaceAll('==', '=')

const _sqlToJsOperators = (part: string): string =>
  part
    .replaceAll(/\bAND\b/g, '&&')
    .replaceAll(/\bOR\b/g, '||')
    .replaceAll(/=+/g, '==')
    .replaceAll('!==', '!=')
    .replaceAll('>==', '>=')
    .replaceAll('<==', '<=')

export const toString = (expr: unknown, exprMode: string = modes.json): string => {
  const string = ExpressionUtils.toString(expr as ExpressionUtils.ExpressionNode)

  return exprMode === modes.sql ? _replaceOutsideQuotes(string, _jsToSqlOperators).replaceAll('"', `'`) : string
}

export const fromString = (string: string, exprMode: string = modes.json): unknown => {
  const exprString = exprMode === modes.json ? string : _replaceOutsideQuotes(string, _sqlToJsOperators)

  return new JavascriptExpressionParser().parse(exprString)
}

export const { isValid } = ExpressionUtils

// ====== Type checking

export const getType = A.prop('type') as (expr: { type?: string }) => string | undefined
const isType = (type: string) => A.propEq('type', type)

// Return true if the nodeDef can be used in expressions and false otherwise
export const isValidExpressionType = (nodeDef: unknown): boolean => !NodeDef.isFile(nodeDef as never)

export const isBinary = isType(types.BinaryExpression)
export const isCall = isType(types.CallExpression)
export const isCompound = isType(types.Compound)
export const isIdentifier = isType(types.Identifier)
export const isLiteral = isType(types.Literal)
export const isSequence = isType(types.SequenceExpression)
export const isThis = isType(types.ThisExpression)

// ====== Instance creators

export const newLiteral = (value: unknown = null): ExpressionUtils.ExpressionNode => ({
  type: types.Literal,
  value,
  raw: value ?? '',
})

export const newIdentifier = (value = ''): ExpressionUtils.ExpressionNode => ({
  type: types.Identifier,
  name: value,
})

export const newBinary = ({
  left,
  right,
  operator = '',
}: {
  left: ExpressionUtils.ExpressionNode
  right: ExpressionUtils.ExpressionNode
  operator?: string
}): ExpressionUtils.ExpressionNode => ({
  type: types.BinaryExpression,
  operator,
  left,
  right,
})

export const newBinaryEmpty = ({
  canBeConstant,
  exprQuery = null,
}: {
  canBeConstant: boolean
  exprQuery?: ExpressionUtils.ExpressionNode | null
}): ExpressionUtils.ExpressionNode => {
  let left = exprQuery
  if (isCompound(exprQuery as never)) {
    left = canBeConstant ? newLiteral() : newIdentifier()
  }
  return newBinary({ left: left as ExpressionUtils.ExpressionNode, right: newLiteral() })
}

export const newCall = ({
  callee,
  params = [],
}: {
  callee?: string
  params?: ExpressionUtils.ExpressionNode[]
} = {}): ExpressionUtils.ExpressionNode => ({
  type: types.CallExpression,
  callee: newLiteral(callee),
  arguments: params,
})
