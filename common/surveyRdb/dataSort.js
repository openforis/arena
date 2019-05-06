const R = require('ramda')

const keys = {
  order: {
    asc: 'asc',
    desc: 'desc',
  },
}

const toHttpParams = R.pipe(
  R.map(R.pick(['variable', 'order'])),
  JSON.stringify
)

const getSortPreparedStatement = sortCriteria => {
  return sortCriteria.reduce((prev, curr, i) => {
    const paramName = `sort_${i}`
    const order = keys.order[curr.order] || keys.order.asc

    return {
      clause: `${prev.clause}${i ? ', ' : ''} $/${paramName}:name/ ${order}`,
      params: { ...prev.params, [paramName]: curr.variable },
    }
  }, { clause: '', params: {} })
}

const getVariable = (variables, value) =>
  R.find(v => v.value === value)(variables)

const getViewExpr = R.pipe(
  R.map(c => `${c.label} ${c.order === keys.order.asc ? 'ASCENDING' : 'DESCENDING'}`),
  R.join(', ')
)

const getNewCriteria = availableVariables => sortCriteria =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))(sortCriteria)

const updateOrder = (pos, order) => sortCriteria => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('order', order)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

const updateVariable = (pos, variable) => sortCriteria => {
  const newVarSortCriteria = R.pipe(
    R.nth(pos),
    R.assoc('variable', variable.value),
    R.assoc('label', variable.label)
  )(sortCriteria)

  return R.update(pos, newVarSortCriteria, sortCriteria)
}

const getUnchosenVariables = availableVariables => sortCriteria =>
  R.reject(v => R.any(s => s.variable === v.value)(sortCriteria))(availableVariables)

const addCriteria = (variable, label, order) => sortCriteria =>
  R.append({ variable, label, order }, sortCriteria)

const deleteCriteria = pos => sortCriteria =>
  R.remove(pos, 1, sortCriteria)

const retainVariables = variables =>
  R.reject(c => R.none(v => c.variable === v, variables))

module.exports = {
  keys,
  toHttpParams,
  getSortPreparedStatement,
  getVariable,
  getViewExpr,
  getNewCriteria,
  updateOrder,
  updateVariable,
  getUnchosenVariables,
  addCriteria,
  deleteCriteria,
  retainVariables,
}
