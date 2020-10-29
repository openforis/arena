import * as R from 'ramda'

import SystemError from '@core/systemError'
import { types } from './types'

// Built-in functions that can be called, i.e. the standard library.
// Nothing outside of this set may be used.
//
// NB: Namespace conflicts between functions and nodes/variables are allowed
// I.e. there can be a field called "pow", even if pow(2,3) is a function invocation.
//
// stdlib: { [fn]: [Function, min_arity, max_arity? (-1 for infinite)] }
const stdlib = {
  pow: [(base, exponent) => base ** exponent, 2], // Arity 2

  ln: [Math.log, 1],
  log10: [Math.log10, 1],

  // arity 1+ (arity 0 allowed by JS)
  min: [Math.min, 1, -1],
  max: [Math.max, 1, -1],

  avg: [R.identity, 1, 1],
  count: [R.identity, 1, 1],
  sum: [R.identity, 1, 1],
}

const unaryOperators = {
  // Only accept bools and nulls as input.
  // Otherwise return null
  '!': (x) => (R.is(Boolean, x) || R.isNil(x) ? !x : null),

  // Negation: Only accept normal finite numbers, otherwise return null
  // NOTE: Under JS semantics, we would have -"123" -> -123
  '-': (x) => (R.is(Number, x) && !Number.isNaN(x) && Number.isFinite(x) ? -x : null),

  // Don't allow the unary + operator now. Define semantics for it first.
  // Under JS semantics, "+" coerces a string to a number.
  // Maybe we should just have `parseNumber` in `stdlib`?
  // '+': x => R.isNil(x) ? null : +x,
}

const booleanOperators = {
  // Short-circuiting operators (we coerce the output to bool)
  '||': (a, b) => Boolean(a || b),
  '&&': (a, b) => Boolean(a && b),
  // Normal boolean operators:
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  // Only allow one kind of equalities.
  // some hidden dependencies on === and !==...
  // '===':  (a, b) => a === b,
  // '!==':  (a, b) => a !== b,
}

const arithmeticOperators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '**': (a, b) => a ** b,
  // Don't allow bitwise operators:
  // '|':   (a, b) => a | b,
  // '^':   (a, b) => a ^ b,
  // '&':   (a, b) => a & b,
  // Don't allow shifts either:
  // '<<':  (a, b) => a << b,
  // '>>':  (a, b) => a >> b,
  // '>>>': (a, b) => a >>> b,
}

const binaryOperators = {
  ...booleanOperators,
  ...arithmeticOperators,
}

const unaryEval = (expr, ctx) => {
  const { argument, operator } = expr

  const fn = unaryOperators[operator]
  if (!fn) {
    throw new SystemError('undefinedFunction', { fnName: operator })
  }

  const res = evalExpression(argument, ctx)
  return fn(res)
}

const binaryEval = (expr, ctx) => {
  const { left, right, operator } = expr

  const fn = binaryOperators[operator]
  if (!fn) {
    throw new SystemError('undefinedFunction', { fnName: operator })
  }

  const leftResult = evalExpression(left, ctx)
  const rightResult = evalExpression(right, ctx)

  const nullCount = [leftResult, rightResult].filter(R.isNil).length

  // Arithmetic operators will always return nulls for any non-numeric inputs
  if (operator in arithmeticOperators) {
    return R.is(Number, leftResult) && R.is(Number, rightResult) ? fn(leftResult, rightResult) : null
  }

  // Boolean operators:
  // Like ternary logic, but logical OR has special handling.
  // The expression is boolean if either value is not null.
  // Otherwise the result is null.
  // All other operators return null if either operand is null
  const isValid = (operator === '||' && nullCount < 2) || nullCount === 0

  return isValid ? fn(leftResult, rightResult) : null
}

// Member expressions like foo.bar are currently not in use, even though they are parsed by JSEP.
const memberEval = () => {
  throw new SystemError('invalidSyntax')
}

const callEval = (expr, ctx) => {
  // Arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr

  const fnName = callee.name
  const fnArity = exprArgs.length

  // No complex expressions may be put in place of a function body.
  // Only a plain identifier is allowed.
  if (callee.type !== types.Identifier) {
    throw new SystemError('invalidSyntax', { fnType: callee.type })
  }

  // The function must be found in the standard library.
  if (!(fnName in stdlib)) {
    throw new SystemError('undefinedFunction', { fnName })
  }

  const [fn, minArity, maxArity] = stdlib[fnName]

  if (fnArity < minArity) {
    throw new SystemError('functionHasTooFewArguments', {
      fnName,
      minArgs: minArity,
      numArgs: fnArity,
    })
  }

  const maxArityIsDefined = maxArity !== undefined
  const maxArityIsInfinite = maxArity < 0
  if (maxArityIsDefined && !maxArityIsInfinite && fnArity > maxArity) {
    throw new SystemError('functionHasTooManyArguments', {
      fnName,
      maxArgs: maxArity,
      numArgs: fnArity,
    })
  }

  const args = exprArgs.map((arg) => evalExpression(arg, ctx))

  // Currently there are no side effects from function evaluation so it's
  // safe to call the function even when we're just parsing the expression
  // to find all identifiers being used.
  return R.apply(fn, args)
}

const literalEval = (expr) => R.prop('value')(expr)

// "this" is a remnant of the JS that's not allowed in our simplified expression syntax.
// We still have to handle "this" since the JSEP parser will produce these nodes.
const thisEval = (expr) => {
  throw new SystemError('invalidSyntax', { keyword: 'this', expr })
}

const identifierEval = (expr) => {
  throw new SystemError('identifierEvalNotImplemented', { expr })
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
  const functions = R.pipe(R.prop('functions'), R.mergeRight(typeFns))(ctx)

  const fn = functions[expr.type]
  if (!fn) {
    throw new SystemError('unsupportedFunctionType', { exprType: expr.type })
  }

  return fn(expr, ctx)
}

export const getExpressionIdentifiers = (expr) => {
  const identifiers = []
  const functions = {
    [types.Identifier]: (exp) => {
      identifiers.push(R.prop('name')(exp))
    },
  }

  evalExpression(expr, { functions })
  return R.uniq(identifiers)
}
