/**
 * Wraps an async function so concurrent calls share one in-flight run (all callers get the same result).
 * @param {Function} fn - The async function to share.
 * @returns {Function} The shared function.
 */
export const singleFlight = <T>(fn: () => Promise<T>): (() => Promise<T>) => {
  let inFlight: Promise<T> | null = null
  return () => {
    inFlight ??= fn().finally(() => {
      inFlight = null
    })
    return inFlight
  }
}
