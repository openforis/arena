type AnyFn = (...args: any[]) => any

/**
 * Performs left-to-right function composition.
 * The first argument may have any arity; the remaining arguments must be unary.
 *
 * @param {...Function} functions - The functions to apply.
 * @returns {Function} - The result function.
 */
export const pipe =
  (...functions: AnyFn[]) =>
  (...values: any[]): any => {
    const [first, ...rest] = functions
    return rest.reduce((currentValue, currentFunction) => currentFunction(currentValue), first(...values))
  }
