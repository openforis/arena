import * as A from '@core/arena'

import { SortCriteria } from '../sortCriteria'

export const create = () => []

// ====== READ
export const { isEmpty } = A
export const containsVariable = (variable) => (sort) =>
  Boolean(sort.find((sortCriteria) => SortCriteria.getVariable(sortCriteria) === variable))

// ====== UPDATE
export const updateSortCriteria = (idx, sortCriteria) => (sort) => {
  const sortClone = [...sort]
  sortClone.splice(idx, 1, sortCriteria)
  return sortClone
}

export const addSortCriteria = (sortCriteria) => (sort) => [...sort, sortCriteria]

export const deleteSortCriteria = (idx) => (sort) => sort.filter((sortCriteria, i) => i !== idx)
