import * as R from 'ramda';

const keys = {
  order: {
    asc: 'asc',
    desc: 'desc',
  },
}

export const toHttpParams = R.pipe(
  R.map(R.pick(['variable', 'order'])),
  JSON.stringify
)

export interface ISortCriteria {
  order: string;
  variable: string;
}

const getSortPreparedStatement = (sortCriteria: ISortCriteria[]) => {
  return sortCriteria.reduce((prev, curr: ISortCriteria, i) => {
    const paramName = `sort_${i}`
    const order = keys.order[curr.order] || keys.order.asc

    return {
      clause: `${prev.clause}${i ? ', ' : ''} $/${paramName}:name/ ${order}`,
      params: { ...prev.params, [paramName]: curr.variable },
    }
  }, { clause: '', params: {} })
}

const findVariableByValue = (value: any) =>
  R.find((v: any) => v.value === value)

export const getViewExpr = (ascLabel, descLabel) => R.pipe(
  R.map((c: any) => `${c.label} ${c.order === keys.order.asc ? ascLabel : descLabel}`),
  R.join(', ')
)

const toString = R.pipe(
  R.defaultTo([]),
  getViewExpr('asc', 'desc')
)

const getNewCriteria = availableVariables =>
  R.filter((c: ISortCriteria) => R.any((v: any) => v.value === c.variable, availableVariables))

const updateOrder = (pos, order) => R.assocPath([pos, 'order'], order)

const updateVariable = (pos, variable) => R.update(pos, {
  variable: R.prop('value', variable),
  label: R.prop('label', variable),
})

const getUnchosenVariables: (availableVariables: any[]) => (sortCriteria: any[]) => any[]
= availableVariables => sortCriteria =>
  R.reject((v: any) => R.any((s: any) => s.variable === v.value)(sortCriteria))(availableVariables)

const addCriteria = (variable, label, order) => R.append({ variable, label, order })

const deleteCriteria = pos => R.remove(pos, 1)

const retainVariables = variables =>
  R.reject((c: any) => R.none((v: any) => c.variable === v, variables))

export default {
  keys,
  toHttpParams,
  getSortPreparedStatement,
  findVariableByValue,
  getViewExpr,
  toString,
  getNewCriteria,
  updateOrder,
  updateVariable,
  getUnchosenVariables,
  addCriteria,
  deleteCriteria,
  retainVariables,
};
