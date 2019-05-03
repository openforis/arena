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

const binaryToString = (node, paramsArr) => {
  const { operator, left, right, right: { type: rightType, value: rightValue } } = node
  const { clause: clauseLeft, paramsArr: paramsArrLeft } = toString(left, paramsArr)

  if (operator === '===' && rightType === types.Literal && rightValue === null) {
    return {
      clause: `${clauseLeft} IS NULL`,
      paramsArr: paramsArrLeft,
    }
  }

  const { clause: clauseRight, paramsArr: paramsArrRight } = toString(right, paramsArrLeft)
  return {
    clause: `${clauseLeft} ${js2sqlOperators[operator]} ${clauseRight}`,
    paramsArr: paramsArrRight,
  }
}

const getNextParamName = paramsArr => `_${paramsArr.length}`

const converters = {
  [types.Identifier]: (node, paramsArr) => ({
    clause: `$/${getNextParamName(paramsArr)}:name/`,
    paramsArr: paramsArr.concat(node.name),
  }),
  [types.BinaryExpression]: binaryToString,
  [types.MemberExpression]: (node, paramsArr) => {
    const obj = toString(node.obj, paramsArr)
    const property = toString(node.property, obj.paramsArr)

    return {
      clause: `${obj.clause}.${property.clause}`,
      paramsArr: property.paramsArr,
    }
  },
  [types.Literal]: (node, paramsArr) => ({
    clause: `$/${getNextParamName(paramsArr)}/`,
    paramsArr: paramsArr.concat(node.raw),
  }),
  [types.UnaryExpression]: (node, paramsArr) => {
    const { clause, paramsArr: newParams } = toString(node.argument, paramsArr)
    return {
      clause: `${node.operator} ${clause}`,
      paramsArr: newParams,
    }
  },
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, paramsArr) => {
    const { clause, paramsArr: newParams } = toString(node.argument, paramsArr)
    return {
      clause: `(${clause})`,
      paramsArr: newParams,
    }
  },
}

const toString = (expr, paramsArr) => converters[expr.type](expr, paramsArr)

const getWherePerparedStatement = expr => {
  const prepStatement = toString(expr, [])
  const params = prepStatement.paramsArr.reduce((acc, cur, i) => ({ ...acc, [`_${i}`]: cur }), {})

  return { clause: prepStatement.clause, params }
}

module.exports = {
  getWherePerparedStatement,
}
