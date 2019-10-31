const R = require('ramda')

const { types } = require('./types')
const { isString } = require('@core/stringUtils')

const SystemError = require('@server/utils/systemError')

// Built-in functions that can be called, i.e. the standard library.
// Nothing outside of this set may be used.
//
// NB: Namespace conflicts between functions and nodes/variables are allowed
// I.e. there can be a field called "pow", even if pow(2,3) is a function invocation.
//
// stdlib: { [fn]: [Function, min_arity, max_arity? (-1 for infinite)] }
const stdlib = {
  pow: [Math.pow, 2], // arity 2

  // arity 1+ (arity 0 allowed by JS)
  min: [Math.min, 1, -1],
  max: [Math.max, 1, -1],
}

const unaryOperators = {
  '!': a => !a,
  // TODO: Under JS semantics, "+" coerces a string to a number. Do we want to allow that?
  '+': a => +a,
  '-': a => -a,
}

const binaryOperators = {
  // Short-circuiting operators (we coerce the output to bool)
  '||':  (a, b) => !!(a || b),
  '&&':  (a, b) => !!(a && b),
  // Normal boolean operators:
  '==':  (a, b) => a === b,
  '!=':  (a, b) => a !== b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
  '<':   (a, b) => a < b,
  '>':   (a, b) => a > b,
  '<=':  (a, b) => a <= b,
  '>=':  (a, b) => a >= b,
  // Don't allow bitwise operators:
  // '|':   (a, b) => a | b,
  // '^':   (a, b) => a ^ b,
  // '&':   (a, b) => a & b,
  // Arithmetic operators:
  '<<':  (a, b) => a << b,
  '>>':  (a, b) => a >> b,
  '>>>': (a, b) => a >>> b,
  '+':   (a, b) => a + b,
  '-':   (a, b) => a - b,
  '*':   (a, b) => a * b,
  '/':   (a, b) => a / b,
  '%':   (a, b) => a % b,
}

const unaryEval = (expr, ctx) => {
  const { argument, operator } = expr

  const fn = unaryOperators[operator]
  if (!fn) throw new SystemError('undefinedFunction', { fnName: operator })

  const res = evalExpression(argument, ctx)

  // const x = `${operator} ${JSON.stringify(res)}`
  // console.log('=== UNARY')
  // console.log(x)
  return fn(res)
}

const binaryEval = (expr, ctx) => {
  const { left, right, operator } = expr

  const fn = binaryOperators[operator]
  if (!fn) throw new SystemError('undefinedFunction', { fnName: operator })

  const leftResult = evalExpression(left, ctx)
  const rightResult = evalExpression(right, ctx)

  if (R.isNil(leftResult) || R.isNil(rightResult))
    return null

  // const x = `${JSON.stringify(leftResult)} ${operator} ${JSON.stringify(rightResult)}`
  // console.log('=== BINARY')
  // console.log(x)
  return fn(leftResult, rightResult)
}

// Member expressions like foo.bar are currently not in use, even though they are parsed by JSEP.
const memberEval = (expr, ctx) => {
  // console.log('== member')
  // console.log(expr)
  throw new SystemError('invalidSyntax')

  const { object, property } = expr

  const objectRes = evalExpression(object, ctx)
  const propertyRes = evalExpression(property, ctx)

  if (!(objectRes && propertyRes))
    return null
  else if (isString(objectRes))
    return eval(`${objectRes}.${propertyRes}`)
  else if (R.has(propertyRes, objectRes))
    return R.prop(propertyRes, objectRes)
  else return null
}

const callEval = (expr, ctx) => {
  // console.log('== call')
  // console.log(expr)

  // arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr

  const fnName = callee.name
  const fnArity = exprArgs.length

  // No complex expressions may be put in place of a function body.
  // Only a plain identifier is allowed.
  if (callee.type !== types.Identifier)
    throw new SystemError('invalidSyntax', { fnType: callee.type })

  // The function must be found in the standard library.
  if (!(fnName in stdlib))
    throw new SystemError('undefinedFunction', { fnName })

  const [fn, minArity, maxArity] = stdlib[fnName]

  if (fnArity < minArity)
    throw new SystemError('functionHasTooFewArguments', { fnName, minArgs: minArity, numArgs: fnArity })

  const maxArityIsDefined = maxArity !== undefined
  const maxArityIsInfinite = maxArity < 0
  if (maxArityIsDefined && !maxArityIsInfinite && fnArity > maxArity)
    throw new SystemError('functionHasTooManyArguments', { fnName, maxArgs: maxArity, numArgs: fnArity })

  const args = exprArgs.map(arg => evalExpression(arg, ctx))

  // Currently there are no side effects from function evaluation so it's
  // safe to call the function even when we're just parsing the expression
  // to find all identifiers being used.
  return R.apply(fn, args)
}

const literalEval = (expr, _ctx) => {
  // console.log('== literal ')
  // console.log(expr)
  return R.prop('value')(expr)
}

// "this" is a remnant of the JS that's not allowed in our simplified expression syntax.
// We still have to handle "this" since the JSEP parser will produce these nodes.
const thisEval = (expr, _ctx) => {
  // console.log('== this ')
  // console.log(expr)
  throw new SystemError('invalidSyntax', { keyword: 'this', expr })
}

const _getIdentifierName = R.prop('name')
const identifierEval = (expr, ctx) => {
  // console.log('== identifierExpression ')
  // console.log(expr)
  const name =_getIdentifierName(expr)

  if (!ctx.node) throw new SystemError('internalError', { name, msg: 'Node context must be defined before evaluation' })

  return ctx.node.getReachableNodeValue(name)
}

const groupEval = (expr, ctx) => {
  const { argument } = expr
  return evalExpression(argument, ctx)
}

const typeFns = {
  [types.Identifier]: identifierEval,
  [types.MemberExpression]: memberEval,
  [types.Literal]: literalEval,
  [types.ThisExpression]: thisEval,
  [types.CallExpression]: callEval,
  [types.UnaryExpression]: unaryEval,
  [types.BinaryExpression]: binaryEval,
  [types.LogicalExpression]: binaryEval,
  [types.GroupExpression]: groupEval,
}

export const evalExpression = (expr, ctx) => {
  const functions = R.pipe(
    R.prop('functions'),
    R.mergeRight(typeFns)
  )(ctx)

  const fn = functions[expr.type]
  if (!fn) throw new SystemError('unsupportedFunctionType', { exprType: expr.type })

  return fn(expr, ctx)
}

export const getExpressionIdentifiers = expr => {
  const identifiers = []
  const functions = {
    [types.Identifier]: (expr, _ctx) => { identifiers.push(_getIdentifierName(expr)) },
  }

  evalExpression(expr, { functions })
  return R.uniq(identifiers)
}
