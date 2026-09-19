/**
 * Returns a function that always returns the given value.
 *
 * @param {*} value - The value to return.
 *
 * @returns {Function} - The result.
 */
export const always = (value: any) => (): any => value
