import * as R from 'ramda'

import SystemError from '@core/systemError'

import { types } from './types'
import { functionImplementations } from './functionImplementations'
import { functions } from './functions'

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

const memberEval = (expr, ctx) => {
  const { object, property } = expr

  const objectEval = evalExpression(object, ctx)
  if (R.isNil(objectEval)) {
    return null
  }
  const propertyEval = evalExpression(property, { ...ctx, node: objectEval })
  if (R.is(Array, objectEval) && property.type === types.Literal && objectEval.length > propertyEval) {
    return objectEval[propertyEval]
  }
  return propertyEval
}

const callEval = (expr, ctx) => {
  // Arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr
  const { functions: functionsCtx = {} } = ctx

  const fnName = callee.name
  const numArgs = exprArgs.length

  // No complex expressions may be put in place of a function body.
  // Only a plain identifier is allowed.
  if (callee.type !== types.Identifier) {
    throw new SystemError('invalidSyntax', { fnType: callee.type })
  }

  // The function must be found in the standard library.
  const functionInfo = functions[fnName]
  if (!functionInfo) {
    throw new SystemError('undefinedFunction', { fnName })
  }

  const { minArity, maxArity, evaluateArgsToNodes = false } = functionInfo

  if (numArgs < minArity) {
    throw new SystemError('functionHasTooFewArguments', {
      fnName,
      minArgs: minArity,
      numArgs,
    })
  }

  const maxArityIsDefined = maxArity !== undefined
  const maxArityIsInfinite = maxArity < 0
  if (maxArityIsDefined && !maxArityIsInfinite && numArgs > maxArity) {
    throw new SystemError('functionHasTooManyArguments', {
      fnName,
      maxArgs: maxArity,
      numArgs,
    })
  }

  const args = exprArgs.map((arg) => evalExpression(arg, { ...ctx, evaluateToNode: evaluateArgsToNodes }))

  const fn = functionsCtx[fnName] || functionImplementations[fnName]

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

const evaluatorsDefault = {
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

export const evalExpression = (expr, ctx = {}) => {
  const evaluators = R.pipe(R.prop('evaluators'), R.mergeRight(evaluatorsDefault))(ctx)

  const fn = evaluators[expr.type]
  if (!fn) {
    throw new SystemError('unsupportedFunctionType', { exprType: expr.type })
  }

  return fn(expr, ctx)
}
