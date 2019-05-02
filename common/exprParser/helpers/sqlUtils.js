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
  const left = toString(node.left, params)
  if (node.operator === '===' && node.right.type === types.Literal && node.right.value === null) {
    return {
      str: `${left.str} IS NULL`,
      params: left.params,
    }
  }

  const right = toString(node.right, left.params)
  return {
    str: `${left.str} ${js2sqlOperators[node.operator]} ${right.str}`,
    params: right.params,
  }
}

const getNextParamName = params => `_${params.length}`

const converters = {
  [types.Identifier]: (node, params) => ({ str: `$/${getNextParamName(params)}:name/`, params: params.concat(node.name) }),
  [types.BinaryExpression]: binaryToString,
  [types.MemberExpression]: (node, params) => ({ str: `${toString(node.object, params).str}.${toString(node.property, params).str}`, params }),
  [types.Literal]: (node, params) => ({ str: `$/${getNextParamName(params)}/`, params: params.concat(node.raw) }),
  [types.UnaryExpression]: (node, params) => ({ str: `${node.operator} ${toString(node.argument, params).str}`, params }),
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, params) => ({ str: `(${toString(node.argument, params).str})`, params }),
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
