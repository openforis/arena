import { _curry2 } from './internal/_curry2'

/**
 * Adds two numbers.
 *
 * @param {*} a - The first number.
 * @param {*} b - The second number.
 *
 * @returns {number} - The result.
 */
export const add = _curry2((a: number, b: number): number => Number(a) + Number(b))
