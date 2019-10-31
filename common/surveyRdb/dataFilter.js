const R = require('ramda')

const { types } = require('@core/expressionParser/expression')
const SystemError = require('@server/utils/systemError')

const js2sqlOperators = {
  '&&': 'AND',
  '||': 'OR',
  // IS (NOT) DISTINCT FROM always returns true/false, even for nulls
  '==': 'IS NOT DISTINCT FROM',
  '!=': 'IS DISTINCT FROM',
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

const stdlib2sql = {
  'pow': 'pow',
  'min': 'least',
  'max': 'greatest',
}

const logicalOrTemplate = `
CASE
  WHEN {left} IS NULL AND {right} IS NULL
  THEN NULL
  ELSE coalesce({left}, false) OR coalesce({right}, false)
END
`.trim()

const binaryToString = (node, paramsArr) => {
  const { operator, left, right } = node
  const clauseLeft = toPreparedStatement(left, paramsArr)
  const clauseRight = toPreparedStatement(right, paramsArr)

  const sqlOperator = js2sqlOperators[operator]

  if (!sqlOperator) throw new SystemError('undefinedFunction', { fnName: operator })

  // Logical OR returns a non-null value if either of its parameters is not null.
  if (sqlOperator == 'OR')
    return logicalOrTemplate
      .replace('{left}', clauseLeft)
      .replace('{right}', clauseRight)

  // Logical OR returns a non-null value if either of its parameters is not null.
  return `${clauseLeft} ${sqlOperator} ${clauseRight}`
}

const addParameterWithValue = (value, paramsArr) => {
  paramsArr.push(value);
  return `_${paramsArr.length - 1}`
}

const converters = {
  [types.Identifier]: (node, paramsArr) => {
    const param = addParameterWithValue(node.name, paramsArr)
    return `$/${param}:name/`
  },
  [types.Literal]: (node, paramsArr) => {
    if (R.isNil(node.value)) return 'NULL'
    const param = addParameterWithValue(node.raw, paramsArr)
    return `$/${param}/`
  },
  [types.UnaryExpression]: (node, paramsArr) => {
    const clause = toPreparedStatement(node.argument, paramsArr)
    return `${node.operator} ${clause}`
  },
  [types.BinaryExpression]: binaryToString,
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: (node, paramsArr) => {
    const clause = toPreparedStatement(node.argument, paramsArr)
    return `(${clause})`
  },
  [types.CallExpression]: (node, paramsArr) => {
    // arguments is a reserved word in strict mode
    const { callee, arguments: exprArgs } = node

    const fnName = callee.name
    const sqlFnName = stdlib2sql[callee.name]
    if (!sqlFnName) throw new SystemError('undefinedFunction', { fnName })

    const clauses = exprArgs.map(arg => toPreparedStatement(arg, paramsArr))
    return `${sqlFnName}(${clauses.join(", ")})`
  }
}

const toPreparedStatement = (expr, paramsArr) => converters[expr.type](expr, paramsArr)

const getWherePreparedStatement = expr => {
  const paramsArr = []
  const prepStatement = toPreparedStatement(expr, paramsArr)
  const params = paramsArr.reduce((acc, cur, i) => ({ ...acc, [`_${i}`]: cur }), {})

  return { clause: prepStatement, params }
}

module.exports = {
  getWherePreparedStatement,
}
