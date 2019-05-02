const { types } = require('./types')

const js2sqlOperators = {
  '&&': 'AND',
  '||': 'OR',
  '===': '=',
  '!==': '!=',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
}

const binaryToString = (node, params) => {
  const { str, params: newParams } = toString(node.left, params)
  if (node.operator === '===' && node.right.type === types.Literal && node.right.value === null) {
    return {
      str: `${str} IS NULL`,
      params: newParams,
    }
  }

  const right = toString(node.right, newParams)
  return {
    str: `${str} ${js2sqlOperators[node.operator]} ${right.str}`,
    params: right.params,
  }
}

const getNextParamName = params => `_${params.length}`

const converters = {
  [types.Identifier]: (node, params) => ({
    str: `$/${getNextParamName(params)}:name/`,
    params: params.concat(node.name),
  }),
  [types.BinaryExpression]: binaryToString,
  [types.MemberExpression]: (node, params) => {
    const obj = toString(node.obj, params)
    const property = toString(node.property, obj.params)

    return {
      str: `${obj.str}.${property.str}`,
      params: property.params,
    }
  },
  [types.Literal]: (node, params) => ({
    str: `$/${getNextParamName(params)}/`,
    params: params.concat(node.raw),
  }),
  [types.UnaryExpression]: (node, params) => {
    const { str, params: newParams } = toString(node.argument, params)
    return {
      str: `${node.operator} ${str}`,
      params: newParams,
    }
  },
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, params) => {
    const { str, params: newParams } = toString(node.argument, params)
    return {
      str: `(${str})`,
      newParams,
    }
  },
}

const toString = (expr, params) => converters[expr.type](expr, params)

const toParamsObj = (paramsArray, prefix = '') => paramsArray.reduce((acc, cur, i) => ({ ...acc, [`${prefix}_${i}`]: cur }), {})

const getWherePerparedStatement = expr => {
  const prepStatement = toString(expr, [])
  const params = toParamsObj(prepStatement.params)

  return { str: prepStatement.str, params }
}

module.exports = {
  getWherePerparedStatement,
  toParamsObj,
}
