import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'

/**
 * Returns the (unique) elements of the first list that are not in the second list.
 *
 * @param {*} list1 - The first array.
 * @param {*} list2 - The second array.
 *
 * @returns {Array} - The result.
 */
export const difference = _curry2((list1: any[], list2: any[]): any[] => {
  const result: any[] = []
  for (const item of list1) {
    if (!list2.some((other) => _equals(other, item)) && !result.some((other) => _equals(other, item))) {
      result.push(item)
    }
  }
  return result
})
