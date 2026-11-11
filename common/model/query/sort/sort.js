import * as A from '@core/arena'

import { SortCriteria } from '../sortCriteria'

export const create = () => []

// ====== READ
export const { isEmpty } = A
export const containsVariable = (variable) => (sort) =>
  sort.some((sortCriteria) => SortCriteria.getVariable(sortCriteria) === variable)

// ====== UPDATE
export const updateSortCriteria = (idx, sortCriteria) => (sort) => {
  const sortClone = [...sort]
  sortClone.splice(idx, 1, sortCriteria)
  return sortClone
}

export const addSortCriteria = (sortCriteria) => (sort) => [...sort, sortCriteria]

export const deleteSortCriteria = (idx) => (sort) => sort.filter((sortCriteria, i) => i !== idx)

// ====== SQL utils
// the sort comes from the client: never put its order value into the SQL as it is
const _getSqlOrder = (sortCriteria) =>
  String(SortCriteria.getOrder(sortCriteria)).toLowerCase() === SortCriteria.orders.desc ? 'DESC' : 'ASC'

export const toSql = (sort) =>
  sort.reduce(
    (accumulator, sortCriteria, idx) => {
      const paramName = `sort_${idx}`
      return {
        clause: `${accumulator.clause}${idx ? ', ' : ''} $/${paramName}:name/ ${_getSqlOrder(sortCriteria)}`,
        params: { ...accumulator.params, [paramName]: SortCriteria.getVariable(sortCriteria) },
      }
    },
    { clause: '', params: {} }
  )
