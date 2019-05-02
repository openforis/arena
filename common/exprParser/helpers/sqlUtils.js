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

const binaryToString = (node, parentParams) => {
  const { str, params } = toString(node.left, parentParams)
  if (node.operator === '===' && node.right.type === types.Literal && node.right.value === null) {
    return {
      str: `${str} IS NULL`,
      params: params,
    }
  }

  const right = toString(node.right, params)
  return {
    str: `${str} ${js2sqlOperators[node.operator]} ${right.str}`,
    params: right.params,
  }
}

const getNextParamName = parentParams => `_${parentParams.length}`

const converters = {
  [types.Identifier]: (node, parentParams) => ({
    str: `$/${getNextParamName(parentParams)}:name/`,
    params: parentParams.concat(node.name),
  }),
  [types.BinaryExpression]: binaryToString,
  [types.MemberExpression]: (node, parentParams) => {
    const obj = toString(node.obj, parentParams)
    const property = toString(node.property, obj.params)

    return {
      str: `${obj.str}.${property.str}`,
      params: property.params,
    }
  },
  [types.Literal]: (node, parentParams) => ({
    str: `$/${getNextParamName(parentParams)}/`,
    params: parentParams.concat(node.raw)
  }),
  [types.UnaryExpression]: (node, parentParams) => {
    const { str, params } = toString(node.argument, parentParams)
    return {
      str: `${node.operator} ${str}`,
      params: params,
    }
  },
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, parentParams) => {
    const { str, params } = toString(node.argument, parentParams)
    return {
      str: `(${str})`,
      params,
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
