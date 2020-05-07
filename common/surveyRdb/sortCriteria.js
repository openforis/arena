import * as R from 'ramda'

export const keys = {
  label: 'label',
  order: 'order',
  variable: 'variable',
}

export const keysOrder = {
  asc: 'asc',
  desc: 'desc',
}

export const getLabel = R.prop(keys.label)
export const getOrder = R.propOr(keysOrder.asc, keys.order)
export const getVariable = R.prop(keys.variable)

// Utility
export const isOrderAsc = R.pipe(getOrder, R.equals(keysOrder.asc))
