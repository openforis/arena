import * as A from '@core/arena'

import { SortCriteria } from '../sortCriteria'
import type { SortCriteriaItem } from '../sortCriteria/sortCriteria'

export type SortItem = SortCriteriaItem[]
type SortUpdater = (sort: SortItem) => SortItem

export const create = (): SortItem => []

// ====== READ
export const { isEmpty } = A
export const containsVariable =
  (variable: string) =>
  (sort: SortItem): boolean =>
    sort.some((sortCriteria) => SortCriteria.getVariable(sortCriteria) === variable)

// ====== UPDATE
export const updateSortCriteria =
  (idx: number, sortCriteria: SortCriteriaItem): SortUpdater =>
  (sort) => {
    const sortClone = [...sort]
    sortClone.splice(idx, 1, sortCriteria)
    return sortClone
  }

export const addSortCriteria =
  (sortCriteria: SortCriteriaItem): SortUpdater =>
  (sort) => [...sort, sortCriteria]

export const deleteSortCriteria =
  (idx: number): SortUpdater =>
  (sort) =>
    sort.filter((_sortCriteria, i) => i !== idx)

// ====== SQL utils
// the sort comes from the client: never put its order value into the SQL as it is
const _getSqlOrder = (sortCriteria: SortCriteriaItem): string =>
  String(SortCriteria.getOrder(sortCriteria)).toLowerCase() === SortCriteria.orders.desc ? 'DESC' : 'ASC'

export const toSql = (sort: SortItem): { clause: string; params: Record<string, string | null> } => {
  let clause = ''
  const params: Record<string, string | null> = {}
  for (const [idx, sortCriteria] of sort.entries()) {
    const paramName = `sort_${idx}`
    clause = `${clause}${idx ? ', ' : ''} $/${paramName}:name/ ${_getSqlOrder(sortCriteria)}`
    params[paramName] = SortCriteria.getVariable(sortCriteria)
  }
  return { clause, params }
}
