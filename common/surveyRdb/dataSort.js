import * as R from 'ramda'

export const keys = {
  order: {
    asc: 'asc',
    desc: 'desc',
  },
}

export const toHttpParams = R.pipe(
  R.map(R.pick(['variable', 'order'])),
  JSON.stringify,
)

export const getSortPreparedStatement = sortCriteria => {
  return sortCriteria.reduce(
    (prev, curr, i) => {
      const paramName = `sort_${i}`
      const order = keys.order[curr.order] || keys.order.asc

      return {
        clause: `${prev.clause}${i ? ', ' : ''} $/${paramName}:name/ ${order}`,
        params: { ...prev.params, [paramName]: curr.variable },
      }
    },
    { clause: '', params: {} },
  )
}

export const findVariableByValue = value => R.find(v => v.value === value)

export const getViewExpr = (ascLabel, descLabel) =>
  R.pipe(
    R.map(
      c => `${c.label} ${c.order === keys.order.asc ? ascLabel : descLabel}`,
    ),
    R.join(', '),
  )

export const toString = R.pipe(R.defaultTo([]), getViewExpr('asc', 'desc'))

export const getNewCriteria = availableVariables =>
  R.filter(c => R.any(v => v.value === c.variable, availableVariables))

export const updateOrder = (pos, order) => R.assocPath([pos, 'order'], order)

export const updateVariable = (pos, variable) =>
  R.update(pos, {
    variable: R.prop('value', variable),
    label: R.prop('label', variable),
  })

export const getUnchosenVariables = availableVariables => sortCriteria =>
  R.reject(v => R.any(s => s.variable === v.value)(sortCriteria))(
    availableVariables,
  )

export const addCriteria = (variable, label, order) =>
  R.append({ variable, label, order })

export const deleteCriteria = pos => R.remove(pos, 1)

export const retainVariables = variables =>
  R.reject(c => R.none(v => c.variable === v, variables))
