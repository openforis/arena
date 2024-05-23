import * as R from 'ramda'

import SystemError from '@core/systemError'

import { types } from '../helpers/types'
import { operators } from '../helpers/operators'

const stdlib2sql = {
  pow: 'pow',
  min: 'least',
  max: 'greatest',
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  isEmpty: (param) => `coalesce(${param}, '') = ''`,
  '!': (param) => `NOT (${param})`,
}

const operatorToSql = {
  '!': (param) => `NOT(${param})`,
}

const logicalOrTemplate = `CASE
  WHEN ({left}) IS NULL AND ({right}) IS NULL
  THEN NULL
  ELSE coalesce({left}, false) OR coalesce({right}, false)
END`

const getParamNameNext = (params) => `_${Object.keys(params).length}`

let _toSql = null

export const binary = (node, params) => {
  const { operator, left, right } = node
  const { clause: clauseLeft, params: paramsLeft } = _toSql(left, params)
  const { clause: clauseRight, params: paramsRight } = _toSql(right, paramsLeft)
  const sqlOperator = operators.js2sqlOperators[operator]

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

export const sequence = (node, params) => {
  const { expression } = node
  const { clause, params: paramsGroup } = _toSql(expression, params)
  return {
    clause: `(${clause})`,
    params: paramsGroup,
  }
}

export const unary = (node, params) => {
  const { clause: clauseArguments, params: paramsUnary } = _toSql(node.argument, params)
  const { operator } = node
  const sqlOperator = operatorToSql[operator] ?? operator
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
const _isQuotedString = (value) =>
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
const _getLiteralParamValue = (value) => {
  if (_isQuotedString(value)) {
    try {
      return JSON.parse(value)
    } catch (e) {
      // ignore it
    }
  }
  return value
}

export const literal = (node, params) => {
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

export const identifier = (node, params) => {
  const param = getParamNameNext(params)
  return {
    clause: `$/${param}:name/`,
    params: { ...params, [param]: node.name },
  }
}

export const call = (node, params) => {
  const { callee, arguments: argumentsNode } = node
  const { name } = callee
  const sqlFnNameOrFn = stdlib2sql[name]
  if (!sqlFnNameOrFn) {
    throw new SystemError('undefinedFunction', { name })
  }

  const { clause: clauseArguments, params: paramsArguments } = argumentsNode.reduce(
    (accumulator, argument, idx) => {
      const { clause: clauseCurrent, params: paramsCurrent } = _toSql(argument, accumulator.params)
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

const functionsByType = {
  [types.Identifier]: identifier,
  [types.Literal]: literal,
  [types.UnaryExpression]: unary,
  [types.BinaryExpression]: binary,
  [types.SequenceExpression]: sequence,
  [types.CallExpression]: call,
}

_toSql = (expression, params = {}) => functionsByType[expression.type](expression, params)

export const toSql = _toSql
