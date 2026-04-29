import { _curry2 } from './internal/_curry2'

type Indexable = Record<PropertyKey, unknown>

/**
 * Returns a function that when supplied an object returns the indicated property of that object.
 *
 * @param {!string|number} property - The property name or array index.
 * @param {!object} object - The object to query.
 *
 * @returns {any} - The value at `object.property`.
 */
export const prop = _curry2((property: PropertyKey, object: Indexable): unknown => object[property])
