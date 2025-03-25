import * as R from 'ramda'

import { isBlank, isNotBlank, trim } from '@core/stringUtils'
import { types } from './types'
import { thisVariable } from '../expressionConstants'

// ToString
const binaryToString = (node) => `${toString(node.left)} ${node.operator} ${toString(node.right)}`

// Valid
const propValid = (prop) => R.pipe(R.prop(prop), isNotBlank)
const binaryValid = (node) => isValid(node.left) && propValid('operator')(node) && isValid(node.right)

const typeProps = {
  [types.Identifier]: {
    toString: R.prop('name'),
    isValid: propValid('name'),
  },
  [types.MemberExpression]: {
    toString: (node) => `${toString(node.object)}.${toString(node.property)}`,
    isValid: (node) => isValid(node.object) && isValid(node.property),
  },
  [types.Literal]: {
    toString: R.prop('raw'),
    isValid: propValid('raw'),
  },
  [types.ThisExpression]: {
    toString: () => thisVariable,
    isValid: () => true,
  },
  [types.CallExpression]: {
    toString: (node) => `${toString(node.callee)}(${node.arguments.map(toString).join(',')})`,
    isValid: (node) => isValid(node.callee),
  },
  [types.UnaryExpression]: {
    toString: (node) => `${node.operator} ${toString(node.argument)}`,
    isValid: (node) => propValid('operator')(node) && isValid(node.argument),
  },
  [types.BinaryExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [types.SequenceExpression]: {
    toString: (node) => `(${toString(node.expression)})`,
    isValid: (node) => isValid(node.expression),
  },
}

const getTypeProp = (type, prop) => R.path([type, prop], typeProps)

export const toString = (expr) => {
  if (isBlank(expr)) return ''
  const toStringFn = getTypeProp(expr.type, 'toString')
  const exprStr = toStringFn(expr)
  return trim(exprStr)
}

export const isValid = (expr) => getTypeProp(expr.type, 'isValid')(expr)
