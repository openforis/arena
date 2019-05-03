const R = require('ramda')

const keys = {
  order: {
    asc: 'asc',
    desc: 'desc',
  },
}

const serialize = sortCriteria =>
  R.pipe(
    R.map(c => `${c.variable} ${c.order}`),
    R.join(',')
  )(sortCriteria)

const getHttpParam = sortCriteria =>
  R.map(
    R.pick(['variable', 'order'])
  )(sortCriteria)

const getSortPreparedStatement = (sortCriteria, prefix = 'sort') => {
  return sortCriteria.reduce((prev, curr, i) => {
    const paramName = `${prefix}_${i}`
    const order = keys.order[curr.order] || keys.order.asc

    return {
      clause: `${prev.clause}${i ? ', ' : ''} $/${paramName}:name/ ${order}`,
      params: { ...prev.params, [paramName]: curr.variable },
    }
  }, { clause: '', params: {} })
}

const getVariable = (variables, value) =>
  R.find(v => v.value === value)(variables)

const getViewExpr = sortCriteria =>
  R.pipe(
    R.map(c => `${c.label} ${c.order === 'asc' ? 'ASCENDING' : 'DESCENDING'}`),
    R.join(', ')
  )(sortCriteria)

const getNewCriteria = (sortCriteria, availableVariables) =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))(sortCriteria)

const updateOrder = (sortCriteria, pos, order) => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('order', order)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

const updateVariable = (sortCriteria, pos, variable) => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('variable', variable.value),
    R.assoc('label', variable.label)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

const getUnchosenVariables = (sortCriteria, availableVariables) =>
  R.filter(v => R.findIndex(sc => sc.variable === v.value)(sortCriteria) === -1)(availableVariables)

const addCriteria = (sortCriteria, variable, label, order) =>
  R.append({ variable, label, order }, sortCriteria)

const deleteCriteria = (sortCriteria, pos) =>
  R.remove(pos, 1, sortCriteria)

const deleteVariablesByNames = (sortStr, variables) =>
  R.filter(c => R.indexOf(c.variable, variables) !== -1)(sortStr)

module.exports = {
  keys,
  serialize,
  getHttpParam,
  getSortPreparedStatement,
  getVariable,
  getViewExpr,
  getNewCriteria,
  updateOrder,
  updateVariable,
  getUnchosenVariables,
  addCriteria,
  deleteCriteria,
  deleteVariablesByNames,
}
