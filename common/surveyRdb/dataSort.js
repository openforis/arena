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

const findVariableByValue = (value) =>
  R.find(v => v.value === value)

const getViewExpr = R.pipe(
  R.map(c => `${c.label} ${c.order === keys.order.asc ? 'ASCENDING' : 'DESCENDING'}`),
  R.join(', ')
)

const getNewCriteria = availableVariables =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))

const updateOrder = (pos, order) => R.assocPath([pos, 'order'], order)

const updateVariable = (pos, variable) => R.update(pos, {
  variable: R.prop('value', variable),
  label: R.prop('label', variable),
})

const getUnchosenVariables = availableVariables => sortCriteria =>
  R.reject(v => R.any(s => s.variable === v.value)(sortCriteria))(availableVariables)

const addCriteria = (variable, label, order) => R.append({ variable, label, order })

const deleteCriteria = pos => R.remove(pos, 1)

const retainVariables = variables =>
  R.reject(c => R.none(v => c.variable === v, variables))

module.exports = {
  keys,
  toHttpParams,
  getSortPreparedStatement,
  findVariableByValue,
  getViewExpr,
  getNewCriteria,
  updateOrder,
  updateVariable,
  getUnchosenVariables,
  addCriteria,
  deleteCriteria,
  retainVariables,
}
