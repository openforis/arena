const isPlainObject = (value: any): boolean => Object.prototype.toString.call(value) === '[object Object]'

/**
 * Deeply merges two objects; on conflicts of non-object values the right one wins.
 *
 * @private
 * @param {object} left - The first object.
 * @param {object} right - The object whose properties take precedence.
 * @returns {object} - The merged object.
 */
export const _mergeDeep = (left: any, right: any): any => {
  const result: any = {}
  for (const key of Object.keys(left)) result[key] = left[key]
  for (const key of Object.keys(right)) {
    result[key] =
      key in left && isPlainObject(left[key]) && isPlainObject(right[key])
        ? _mergeDeep(left[key], right[key])
        : right[key]
  }
  return result
}
