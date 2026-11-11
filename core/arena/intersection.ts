import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'
import { uniq } from './uniq'

/**
 * Returns the (unique) elements that are in both lists.
 *
 * @param {*} list1 - The first array.
 * @param {*} list2 - The second array.
 *
 * @returns {Array} - The result.
 */
export const intersection = _curry2((list1: any[], list2: any[]): any[] => {
  const lookupList = list1.length > list2.length ? list1 : list2
  const filteredList = list1.length > list2.length ? list2 : list1
  return uniq(filteredList.filter((item) => lookupList.some((other) => _equals(other, item))))
})
