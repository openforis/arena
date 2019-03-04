import * as R from 'ramda'

export const serialize = sortCriteria =>
  sortCriteria.map(s => `${s.variable} ${s.order}`).join(', ')

export const deserialize = sortStr => {
  return !sortStr
    ? []
    : R.pipe(
      R.split(','),
      R.map(R.trim()),
      R.map(R.split(/ +/)),
      R.map(([variable, order]) => ({ variable, order }))
    )(sortStr)
}

export const getNewCriteria = (sortCriteria, availableVariables) =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))(sortCriteria)

export const update = (sortCriteria, pos, key, value) => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc(key, value)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

export const getUnchosenVariables = (sortCriteria, availableVariables) =>
  availableVariables.filter(v => sortCriteria.findIndex(sc => sc.variable === v.value) === -1)

export const addCriteria = (sortCriteria, variable, order) =>
  R.append({ variable, order }, sortCriteria)

export const deleteCriteria = (sortCriteria, pos) =>
  R.remove(pos, 1, sortCriteria)

export const deleteVariablesByName = (sortCriteria, variables) => R.filter(c => R.indexOf(c.variable, variables) !== -1)(sortCriteria)

export const deleteVariablesByNames = (sortStr, variables) =>
  R.pipe(
    deserialize,
    R.filter(c => R.indexOf(c.variable, variables) !== -1),
    serialize
  )(sortStr)