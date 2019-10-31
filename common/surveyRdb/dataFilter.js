const R = require('ramda')

const { types } = require('@core/expressionParser/expression')
const SystemError = require('@server/utils/systemError')

const js2sqlOperators = {
  '&&': 'AND',
  '||': 'OR',
  // IS (NOT) DISTINCT FROM always returns true/false, even for nulls
  '===': 'IS NOT DISTINCT FROM',
  '!==': 'IS DISTINCT FROM',
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
  const { operator, left, right } = node
  const { clause: clauseLeft, paramsArr: paramsArrLeft } = toPreparedStatement(left, paramsArr)
  const { clause: clauseRight, paramsArr: paramsArrRight } = toPreparedStatement(right, paramsArrLeft)

  const sqlOperator = js2sqlOperators[operator]

  if (!sqlOperator) throw new SystemError('undefinedFunction', { fnName: operator })

  // Logical OR returns a non-null value if either of its parameters is not null.
  if (sqlOperator == 'OR')
    return {
      clause: `
      CASE
        WHEN ${clauseLeft} IS NULL AND ${clauseRight} IS NULL
        THEN NULL
        ELSE coalesce(${clauseLeft}, false) OR coalesce(${clauseRight}, false)
      END
      `,
      paramsArr: paramsArrRight,
    }

  // Logical OR returns a non-null value if either of its parameters is not null.
  return {
    clause: `${clauseLeft} ${sqlOperator} ${clauseRight}`,
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
    const obj = toPreparedStatement(node.obj, paramsArr)
    const property = toPreparedStatement(node.property, obj.paramsArr)

    return {
      clause: `${obj.clause}.${property.clause}`,
      paramsArr: property.paramsArr,
    }
  },
  [types.Literal]: (node, paramsArr) => ({
    clause: `$/${getNextParamName(paramsArr)}/`,
    paramsArr: paramsArr.concat([
      R.isNil(node.value) ? null : node.raw
    ]),
  }),
  [types.UnaryExpression]: (node, paramsArr) => {
    const { clause, paramsArr: newParams } = toPreparedStatement(node.argument, paramsArr)
    return {
      clause: `${node.operator} ${clause}`,
      paramsArr: newParams,
    }
  },
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, paramsArr) => {
    const { clause, paramsArr: newParams } = toPreparedStatement(node.argument, paramsArr)
    return {
      clause: `(${clause})`,
      paramsArr: newParams,
    }
  },
}

const toPreparedStatement = (expr, paramsArr) => converters[expr.type](expr, paramsArr)

const getWherePreparedStatement = expr => {
  const prepStatement = toPreparedStatement(expr, [])
  const params = prepStatement.paramsArr.reduce((acc, cur, i) => ({ ...acc, [`_${i}`]: cur }), {})

  return { clause: prepStatement.clause, params }
}

module.exports = {
  getWherePreparedStatement,
}
