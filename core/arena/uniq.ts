import { _curry1 } from './internal/_curry1'
import { _equals } from './internal/_equals'

/**
 * Returns a new list containing only one copy of each deeply equal element.
 *
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const uniq = _curry1((list: any[]): any[] =>
  list.reduce((acc: any[], item: any) => {
    if (!acc.some((existing) => _equals(existing, item))) acc.push(item)
    return acc
  }, [])
)
