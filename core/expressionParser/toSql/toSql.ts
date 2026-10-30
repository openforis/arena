import * as A from '@core/arena'

import SystemError from '@core/systemError'

import { types } from '../helpers/types'
import { operators } from '../helpers/operators'

type SqlParams = Record<string, unknown>

interface SqlResult {
  clause: string
  params: SqlParams
}

// pattern matching functions (SQL LIKE / ILIKE): the value is compared as text
const likeFn =
  (sqlOperator: string) =>
  (args: string[]): string => {
    if (args.length !== 2) {
      throw new SystemError('functionHasTooFewArguments', {
        fnName: sqlOperator.toLowerCase(),
        minArity: 2,
        numArgs: args.length,
      })
    }
    const [value, pattern] = args
    return `(${value})::text ${sqlOperator} ${pattern}`
  }

const stdlib2sql: Record<string, string | ((args: string[]) => string)> = {
  pow: 'pow',
  min: 'least',
  max: 'greatest',
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  isEmpty: ([param]) => `coalesce((${param})::text, '') = ''`,
  isNotEmpty: ([param]) => `coalesce((${param})::text, '') <> ''`,
  like: likeFn('LIKE'),
  ilike: likeFn('ILIKE'),
  '!': ([param]) => `NOT (${param})`,
}

// unary operators allowed in SQL (the expression can come from the client: any other operator is rejected)
const operatorToSql: Record<string, string | ((param: string) => string)> = {
  '!': (param) => `NOT(${param})`,
  '-': '-',
  '+': '+',
}

const logicalOrTemplate = `CASE
  WHEN ({left}) IS NULL AND ({right}) IS NULL
  THEN NULL
  ELSE coalesce({left}, false) OR coalesce({right}, false)
END`

// own properties only: keys like "constructor" must not resolve to Object.prototype members
const _getOwn = <T>(record: Record<string, T>, key: unknown): T | null =>
  typeof key === 'string' && Object.hasOwn(record, key) ? record[key] : null

const getParamNameNext = (params: SqlParams): string => `_${Object.keys(params).length}`

let _toSql: ((expression: Record<string, unknown>, params?: SqlParams) => SqlResult) | null = null

export const binary = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { operator, left, right } = node
  const { clause: clauseLeft, params: paramsLeft } = _toSql!(left as Record<string, unknown>, params)
  const { clause: clauseRight, params: paramsRight } = _toSql!(right as Record<string, unknown>, paramsLeft)
  const sqlOperator = _getOwn(operators.js2sqlOperators, operator)

  if (!sqlOperator) {
    throw new SystemError('undefinedFunction', { fnName: operator })
  }

  if (sqlOperator === 'OR') {
    return {
      clause: logicalOrTemplate.replaceAll('{left}', clauseLeft).replaceAll('{right}', clauseRight),
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
  const sqlOperator = _getOwn(operatorToSql, operator)
  if (!sqlOperator) {
    throw new SystemError('undefinedFunction', { fnName: operator })
  }
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
  typeof value === 'string' && value.length >= 2 && value.startsWith('"') && value.endsWith('"')

const _isSingleQuotedString = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 2 && value.startsWith(`'`) && value.endsWith(`'`)

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
  if (_isSingleQuotedString(value)) {
    // SQL style string literal (e.g. written in the advanced expression editor)
    return value.slice(1, -1).replaceAll(String.raw`\'`, `'`)
  }
  return value
}

export const literal = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  if (A.isNil(node.value)) {
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
  const sqlFnNameOrFn = _getOwn(stdlib2sql, name)
  if (!sqlFnNameOrFn) {
    throw new SystemError('undefinedFunction', { name })
  }

  const clausesArguments: string[] = []
  let paramsArguments = params
  for (const argument of argumentsNode as Record<string, unknown>[]) {
    const { clause: clauseCurrent, params: paramsCurrent } = _toSql!(argument, paramsArguments)
    clausesArguments.push(clauseCurrent)
    paramsArguments = paramsCurrent
  }

  const clause =
    typeof sqlFnNameOrFn === 'string'
      ? `${sqlFnNameOrFn}(${clausesArguments.join(', ')})`
      : sqlFnNameOrFn(clausesArguments)

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
  const fn = _getOwn(functionsByType, expression.type)
  if (!fn) {
    throw new SystemError('appErrors:undefinedExpressionType', { type })
  }
  return fn(expression, params)
}

export const toSql = _toSql
