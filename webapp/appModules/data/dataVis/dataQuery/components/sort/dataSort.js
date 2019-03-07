import * as R from 'ramda'

export const serialize = sortCriteria =>
  R.pipe(
    R.map(c => `${c.variable} ${c.order}`),
    R.join(',')
  )(sortCriteria)

export const getVariable = (variables, value) => R.find(v => v.value === value)(variables)

export const getViewExpr = (sortCriteria) =>
  R.pipe(
    R.map(c => `${c.label} ${c.order === 'asc' ? 'ASCENDING' : 'DESCENDING'}`),
    R.join(', ')
  )(sortCriteria)

export const getNewCriteria = (sortCriteria, availableVariables) =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))(sortCriteria)

export const updateOrder = (sortCriteria, pos, order) => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('order', order)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

export const updateVariable = (sortCriteria, pos, variable) => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('variable', variable.value),
    R.assoc('label', variable.label)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

export const getUnchosenVariables = (sortCriteria, availableVariables) =>
  availableVariables.filter(v => sortCriteria.findIndex(sc => sc.variable === v.value) === -1)

export const addCriteria = (sortCriteria, variable, label, order) =>
  R.append({ variable, label, order }, sortCriteria)

export const deleteCriteria = (sortCriteria, pos) =>
  R.remove(pos, 1, sortCriteria)

export const deleteVariablesByName = (sortCriteria, variables) =>
  R.filter(c => R.indexOf(c.variable, variables) !== -1)(sortCriteria)

export const deleteVariablesByNames = (sortStr, variables) =>
  R.filter(c => R.indexOf(c.variable, variables) !== -1)(sortStr)