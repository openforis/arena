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

export const getName = R.prop('name') as (expr: { name?: string }) => string | undefined

export const toString = (expr: unknown, exprMode: string = modes.json): string => {
  const string = ExpressionUtils.toString(expr as ExpressionUtils.ExpressionNode)

  return exprMode === modes.sql
    ? R.pipe(R.replace(/&&/g, 'AND'), R.replace(/\|\|/g, 'OR'), R.replace(/==/g, '='), R.replace(/"/g, `'`))(string)
    : string
}

export const fromString = (string: string, exprMode: string = modes.json): unknown => {
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

export const getType = R.prop('type') as (expr: { type?: string }) => string | undefined
const isType = (type: string) => R.propEq('type', type)

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
