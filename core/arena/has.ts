import { _curry2 } from './internal/_curry2'

/**
 * Checks if the object has the given own property.
 */
export const has = _curry2(
  (property: PropertyKey, object: any): boolean =>
    object !== null && object !== undefined && Object.hasOwn(object, property)
)
