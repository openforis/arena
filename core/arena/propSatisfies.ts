import { _curry3 } from './internal/_curry3'

/**
 * Checks if the property value satisfies the predicate.
 */
export const propSatisfies = _curry3(
  (predicate: (value: any) => boolean, property: PropertyKey, object: any): boolean => predicate(object[property])
)
