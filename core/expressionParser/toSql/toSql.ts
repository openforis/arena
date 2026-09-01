import * as R from 'ramda'

import SystemError from '@core/systemError'

import { types } from '../helpers/types'
import { operators } from '../helpers/operators'

type SqlParams = Record<string, unknown>

interface SqlResult {
  clause: string
  params: SqlParams
}

const stdlib2sql: Record<string, string | ((param: string) => string)> = {
  pow: 'pow',
  min: 'least',
  max: 'greatest',
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  isEmpty: (param) => `coalesce((${param})::text, '') = ''`,
  isNotEmpty: (param) => `coalesce((${param})::text, '') <> ''`,
  '!': (param) => `NOT (${param})`,
}

const operatorToSql: Record<string, string | ((param: string) => string)> = {
  '!': (param) => `NOT(${param})`,
}

const logicalOrTemplate = `CASE
  WHEN ({left}) IS NULL AND ({right}) IS NULL
  THEN NULL
  ELSE coalesce({left}, false) OR coalesce({right}, false)
END`

const getParamNameNext = (params: SqlParams): string => `_${Object.keys(params).length}`

let _toSql: ((expression: Record<string, unknown>, params?: SqlParams) => SqlResult) | null = null

export const binary = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { operator, left, right } = node
  const { clause: clauseLeft, params: paramsLeft } = _toSql!(left as Record<string, unknown>, params)
  const { clause: clauseRight, params: paramsRight } = _toSql!(right as Record<string, unknown>, paramsLeft)
  const sqlOperator = operators.js2sqlOperators[operator as string]

  if (!sqlOperator) {
    throw new SystemError('undefinedFunction', { fnName: operator })
  }

  if (sqlOperator === 'OR') {
    return {
      clause: logicalOrTemplate.replace(/{left}/g, clauseLeft).replace(/{right}/g, clauseRight),
      params: { ...paramsLeft, ...paramsRight },
    }
  }

  return {
    clause: `${clauseLeft} ${sqlOperator} ${clauseRight}`,
    params: { ...paramsLeft, ...paramsRight },
  }
}

export const sequence = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { expression } = node
  const { clause, params: paramsGroup } = _toSql!(expression as Record<string, unknown>, params)
  return {
    clause: `(${clause})`,
    params: paramsGroup,
  }
}

export const unary = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { clause: clauseArguments, params: paramsUnary } = _toSql!(node.argument as Record<string, unknown>, params)
  const { operator } = node
  const sqlOperator = operatorToSql[operator as string] ?? (operator as string)
  const clause = typeof sqlOperator === 'string' ? `${sqlOperator} ${clauseArguments}` : sqlOperator(clauseArguments)
  return {
    clause,
    params: paramsUnary,
  }
}

/**
 * Returns true if the specified value is a string that starts and ends with a double quote (") char.
 *
 * @param {!string} value - The value to test.
 * @returns {boolean} - True if the value is quoted, false otherwise.
 */
const _isQuotedString = (value: unknown): boolean =>
  typeof value === 'string' && value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"'

/**
 * Expression node value could have been "stringified" (e.g. Attributes of type code/taxon/text)
 * so it needs to be parsed.
 * When the value is a string, it will be quoted by pg-promise itself, so there is no need to double quote it
 * and if it's already quoted, remove the double quotes.
 *
 * @param {!string} value - The value to parse.
 * @returns {object} - The result of the parsing.
 */
const _getLiteralParamValue = (value: unknown): unknown => {
  if (_isQuotedString(value)) {
    try {
      return JSON.parse(value as string)
    } catch {
      // ignore it
    }
  }
  return value
}

export const literal = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  if (R.isNil(node.value)) {
    return {
      clause: 'NULL',
      params,
    }
  }

  const param = getParamNameNext(params)
  const paramValue = _getLiteralParamValue(node.raw)

  return {
    clause: `$/${param}/`,
    params: { ...params, [param]: paramValue },
  }
}

export const identifier = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const param = getParamNameNext(params)
  return {
    clause: `$/${param}:name/`,
    params: { ...params, [param]: node.name },
  }
}

export const call = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { callee, arguments: argumentsNode } = node
  const calleeNode = callee as Record<string, unknown>
  const name = (calleeNode.name ?? calleeNode.value) as string // callee can be literal or identifier
  const sqlFnNameOrFn = stdlib2sql[name]
  if (!sqlFnNameOrFn) {
    throw new SystemError('undefinedFunction', { name })
  }

  const { clause: clauseArguments, params: paramsArguments } = (argumentsNode as Record<string, unknown>[]).reduce(
    (accumulator: SqlResult, argument: Record<string, unknown>, idx: number) => {
      const { clause: clauseCurrent, params: paramsCurrent } = _toSql!(argument, accumulator.params)
      return {
        clause: `${accumulator.clause}${idx ? ', ' : ''}${clauseCurrent}`,
        params: paramsCurrent,
      }
    },
    { clause: '', params }
  )

  const clause =
    typeof sqlFnNameOrFn === 'string' ? `${sqlFnNameOrFn}(${clauseArguments})` : sqlFnNameOrFn(clauseArguments)

  return {
    clause,
    params: paramsArguments,
  }
}

const functionsByType: Record<string, (node: Record<string, unknown>, params: SqlParams) => SqlResult> = {
  [types.Identifier]: identifier,
  [types.Literal]: literal,
  [types.UnaryExpression]: unary,
  [types.BinaryExpression]: binary,
  [types.SequenceExpression]: sequence,
  [types.CallExpression]: call,
}

_toSql = (expression: Record<string, unknown>, params: SqlParams = {}): SqlResult => {
  const { type } = expression
  const fn = functionsByType[expression.type as string]
  if (!fn) {
    throw new SystemError('appErrors:undefinedExpressionType', { type })
  }
  return fn(expression, params)
}

export const toSql = _toSql
