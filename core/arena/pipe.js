/**
 * Performs left-to-right function composition.
 * The first argument may have any arity; the remaining arguments must be unary.
 *
 * @param {...Function} functions - The functions to apply.
 * @returns {Function} - The result function.
 */
export const pipe = (...functions) => (...values) =>
  functions.reduce(
    (currentValue, currentFunction, idx) => (idx === 0 ? currentFunction(...values) : currentFunction(currentValue)),
    {}
  )
