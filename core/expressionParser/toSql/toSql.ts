import * as A from '@core/arena'

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

interface StringMethodSql {
  arity: number
  toSql: (object: string, args: string[]) => string
}

// JS string methods allowed on values (e.g. text_attr.includes('abc')), converted into SQL text functions;
// strpos/left/right are used instead of LIKE so that % and _ in the searched text don't act as wildcards
const stringMethods2sql: Record<string, StringMethodSql> = {
  includes: { arity: 1, toSql: (object, [search]) => `coalesce(strpos(${object}, ${search}) > 0, false)` },
  startsWith: {
    arity: 1,
    toSql: (object, [search]) => `coalesce(left(${object}, length(${search})) = ${search}, false)`,
  },
  endsWith: {
    arity: 1,
    toSql: (object, [search]) => `coalesce(right(${object}, length(${search})) = ${search}, false)`,
  },
  toLowerCase: { arity: 0, toSql: (object) => `lower(${object})` },
  toUpperCase: { arity: 0, toSql: (object) => `upper(${object})` },
  trim: { arity: 0, toSql: (object) => `btrim(${object})` },
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

const _isSingleQuotedString = (value: unknown): boolean =>
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
  // single quoted literal (e.g. attr = 'text'): the parser has already unquoted it into node.value
  const paramValue = _isSingleQuotedString(node.raw) ? node.value : _getLiteralParamValue(node.raw)

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

interface SqlArgumentsResult {
  clauses: string[]
  params: SqlParams
}

const argumentsToSql = (argumentNodes: Record<string, unknown>[], params: SqlParams): SqlArgumentsResult =>
  argumentNodes.reduce<SqlArgumentsResult>(
    (accumulator, argument) => {
      const { clause, params: paramsCurrent } = _toSql!(argument, accumulator.params)
      return { clauses: [...accumulator.clauses, clause], params: paramsCurrent }
    },
    { clauses: [], params }
  )

// e.g. text_attr.includes('abc'): only non computed calls of the allowed string methods are accepted
const stringMethodCall = (
  callee: Record<string, unknown>,
  argumentNodes: Record<string, unknown>[],
  params: SqlParams
): SqlResult => {
  const property = callee.property as Record<string, unknown>
  const methodName = !callee.computed && property?.type === types.Identifier ? property.name : null
  const method = _getOwn(stringMethods2sql, methodName)
  if (!method) {
    throw new SystemError('undefinedFunction', { name: methodName })
  }
  const numArgs = argumentNodes.length
  if (numArgs !== method.arity) {
    const errorKey = numArgs < method.arity ? 'functionHasTooFewArguments' : 'functionHasTooManyArguments'
    throw new SystemError(errorKey, { fnName: methodName, minArity: method.arity, maxArity: method.arity, numArgs })
  }
  const { clause: clauseObject, params: paramsObject } = _toSql!(callee.object as Record<string, unknown>, params)
  const { clauses: clausesArguments, params: paramsArguments } = argumentsToSql(argumentNodes, paramsObject)
  const toText = (clause: string): string => `(${clause})::text`
  return {
    clause: method.toSql(toText(clauseObject), clausesArguments.map(toText)),
    params: paramsArguments,
  }
}

export const call = (node: Record<string, unknown>, params: SqlParams): SqlResult => {
  const { callee, arguments: argumentsNode } = node
  const calleeNode = callee as Record<string, unknown>
  const argumentNodes = argumentsNode as Record<string, unknown>[]
  if (calleeNode.type === types.MemberExpression) {
    return stringMethodCall(calleeNode, argumentNodes, params)
  }
  const name = (calleeNode.name ?? calleeNode.value) as string // callee can be literal or identifier
  const sqlFnNameOrFn = _getOwn(stdlib2sql, name)
  if (!sqlFnNameOrFn) {
    throw new SystemError('undefinedFunction', { name })
  }

  const { clauses, params: paramsArguments } = argumentsToSql(argumentNodes, params)
  const clauseArguments = clauses.join(', ')

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
  const fn = _getOwn(functionsByType, expression.type)
  if (!fn) {
    throw new SystemError('appErrors:undefinedExpressionType', { type })
  }
  return fn(expression, params)
}

export const toSql = _toSql
