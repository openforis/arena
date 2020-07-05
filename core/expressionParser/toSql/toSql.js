import * as R from 'ramda'

import SystemError from '@core/systemError'

import { types } from '../helpers/types'
import { operators } from '../helpers/operators'

const stdlib2sql = {
  pow: 'pow',
  min: 'least',
  max: 'greatest',
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

export const group = (node, params) => {
  const { clause, params: paramsGroup } = _toSql(node.argument, params)
  return {
    clause: `(${clause})`,
    params: paramsGroup,
  }
}

export const unary = (node, params) => {
  const { clause, params: paramsUnary } = _toSql(node.argument, params)
  return {
    clause: `${node.operator} ${clause}`,
    params: paramsUnary,
  }
}

export const literal = (node, params) => {
  if (R.isNil(node.value)) {
    return {
      clause: 'NULL',
      params,
    }
  }

  const param = getParamNameNext(params)
  return {
    clause: `$/${param}/`,
    params: { ...params, [param]: node.raw },
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
  const sqlFnName = stdlib2sql[name]
  if (!sqlFnName) {
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

  return {
    clause: `${sqlFnName}(${clauseArguments})`,
    params: paramsArguments,
  }
}

const functionsByType = {
  [types.Identifier]: identifier,
  [types.Literal]: literal,
  [types.UnaryExpression]: unary,
  [types.BinaryExpression]: binary,
  [types.LogicalExpression]: binary,
  [types.GroupExpression]: group,
  [types.CallExpression]: call,
}

_toSql = (expression, params = {}) => functionsByType[expression.type](expression, params)

export const toSql = _toSql
