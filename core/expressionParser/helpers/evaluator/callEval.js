import SystemError from '@core/systemError'

import { functionImplementations } from '../functionImplementations'
import { functions } from '../functions'
import { types } from '../types'
import { globalIdentifierEval } from './globalIdentifierEval'

const _callMemberEval = ({ evalExpression, expr, ctx }) => {
  // Arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr

  // global function (e.g. Math.round(...))
  const fn = evalExpression(callee, ctx)
  if (fn) {
    const args = exprArgs.map((arg) => evalExpression(arg, ctx))
    return fn(...args)
  }
  return null
}

const _callIdentifierCustomFunctionEval = ({ evalExpression, expr, ctx }) => {
  // Arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr
  const { functions: functionsCtx = {} } = ctx

  const { name: fnName } = callee
  const numArgs = exprArgs.length

  const functionInfo = functions[fnName]

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
  return fn(...args)
}

const _callIdentifierEval = ({ evalExpression, expr, ctx }) => {
  // Arguments is a reserved word in strict mode
  const { callee, arguments: exprArgs } = expr
  const { node: nodeContext } = ctx

  const { name: fnName } = callee

  const functionInfo = functions[fnName]
  if (functionInfo) {
    // The function is among the Arena custom functions.
    return _callIdentifierCustomFunctionEval({ evalExpression, functionInfo, expr, ctx })
  }
  // identifier is a global object
  const globalFn = globalIdentifierEval({ identifierName: fnName, nodeContext })
  if (globalFn !== null) {
    const args = exprArgs.map((arg) => evalExpression(arg, ctx))
    return globalFn(...args)
  }

  throw new SystemError('undefinedFunction', { fnName })
}

export const callEval = ({ evalExpression }) => (expr, ctx) => {
  const { callee } = expr

  switch (callee.type) {
    case types.MemberExpression:
      return _callMemberEval({ evalExpression, expr, ctx })
    case types.Identifier:
      return _callIdentifierEval({ evalExpression, expr, ctx })
    default:
      // No complex expressions may be put in place of a function body.
      // Only a plain identifier is allowed.
      throw new SystemError('invalidSyntax', { fnType: callee.type })
  }
}
