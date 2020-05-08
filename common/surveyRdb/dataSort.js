import * as R from 'ramda'

import * as SortCriteria from './sortCriteria'

export const keys = {
  order: {
    ...SortCriteria.keysOrder,
  },
}

export const toHttpParams = R.pipe(R.map(R.pick(['variable', 'order'])), JSON.stringify)

export const getSortPreparedStatement = (sortCriteria) => {
  return sortCriteria.reduce(
    (prev, curr, i) => {
      const paramName = `sort_${i}`
      const order = SortCriteria.getOrder(curr)

      return {
        clause: `${prev.clause}${i ? ', ' : ''} $/${paramName}:name/ ${order}`,
        params: { ...prev.params, [paramName]: SortCriteria.getVariable(curr) },
      }
    },
    { clause: '', params: {} }
  )
}

export const findVariableByValue = (value) => R.find((v) => v.value === value)

export const getViewExpr = (ascLabel, descLabel) =>
  R.pipe(
    R.map(
      (sortCriteria) =>
        `${SortCriteria.getLabel(sortCriteria)} ${SortCriteria.isOrderAsc(sortCriteria) ? ascLabel : descLabel}`
    ),
    R.join(', ')
  )

export const toString = R.pipe(R.defaultTo([]), getViewExpr('asc', 'desc'))

export const getNewCriteria = (availableVariables) =>
  R.filter((c) => R.any((v) => v.value === c.variable, availableVariables))

export const updateOrder = (pos, order) => R.assocPath([pos, 'order'], order)

export const updateVariable = (pos, variable) =>
  R.update(pos, {
    variable: R.prop('value', variable),
    label: R.prop('label', variable),
  })

export const getUnchosenVariables = (availableVariables) => (sortCriteria) =>
  R.reject((v) => R.any((s) => s.variable === v.value)(sortCriteria))(availableVariables)

export const addCriteria = (variable, label, order) => R.append({ variable, label, order })

export const deleteCriteria = (pos) => R.remove(pos, 1)

export const retainVariables = (variables) => R.reject((c) => R.none((v) => c.variable === v, variables))
