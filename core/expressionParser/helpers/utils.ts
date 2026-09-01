import * as R from 'ramda'

import { isBlank, isNotBlank, trim } from '@core/stringUtils'

import { types } from './types'
import { thisVariable } from '../expressionConstants'

export interface ExpressionNode {
  type: string
  [key: string]: unknown
}

// ToString
const binaryToString = (node: ExpressionNode): string =>
  `${toString(node.left as ExpressionNode)} ${node.operator} ${toString(node.right as ExpressionNode)}`

// Valid
const propValid = (prop: string) => R.pipe(R.prop(prop), isNotBlank)
const binaryValid = (node: ExpressionNode): boolean =>
  isValid(node.left as ExpressionNode) && propValid('operator')(node) && isValid(node.right as ExpressionNode)

interface TypeProps {
  toString: (node: ExpressionNode) => string
  isValid: (node: ExpressionNode) => boolean
}

const typeProps: Record<string, TypeProps> = {
  [types.Identifier]: {
    toString: R.prop('name') as (node: ExpressionNode) => string,
    isValid: propValid('name') as (node: ExpressionNode) => boolean,
  },
  [types.MemberExpression]: {
    toString: (node) => `${toString(node.object as ExpressionNode)}.${toString(node.property as ExpressionNode)}`,
    isValid: (node) => isValid(node.object as ExpressionNode) && isValid(node.property as ExpressionNode),
  },
  [types.Literal]: {
    toString: R.prop('raw') as (node: ExpressionNode) => string,
    isValid: propValid('raw') as (node: ExpressionNode) => boolean,
  },
  [types.ThisExpression]: {
    toString: () => thisVariable,
    isValid: () => true,
  },
  [types.CallExpression]: {
    toString: (node) =>
      `${toString(node.callee as ExpressionNode)}(${(node.arguments as ExpressionNode[]).map(toString).join(',')})`,
    isValid: (node) => isValid(node.callee as ExpressionNode),
  },
  [types.UnaryExpression]: {
    toString: (node) => `${node.operator} ${toString(node.argument as ExpressionNode)}`,
    isValid: (node) => propValid('operator')(node) && isValid(node.argument as ExpressionNode),
  },
  [types.BinaryExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [types.SequenceExpression]: {
    toString: (node) => `(${toString(node.expression as ExpressionNode)})`,
    isValid: (node) => isValid(node.expression as ExpressionNode),
  },
}

const getTypeProp = (type: string, prop: keyof TypeProps) => R.path([type, prop], typeProps) as TypeProps[typeof prop]

export const toString = (expr: ExpressionNode | null | undefined): string => {
  if (isBlank(expr)) return ''
  const toStringFn = getTypeProp(expr!.type, 'toString')
  const exprStr = toStringFn(expr!)
  return trim(exprStr)
}

export const isValid = (expr: ExpressionNode | null | undefined): boolean => {
  if (!expr) return false
  return (getTypeProp(expr.type, 'isValid') as (node: ExpressionNode) => boolean)(expr)
}
