import * as A from '@core/arena'

const keys = {
  label: 'label',
  order: 'order',
  variable: 'variable',
}

export const orders = {
  asc: 'asc',
  desc: 'desc',
}

export const create = () => ({
  [keys.label]: null,
  [keys.order]: null,
  [keys.variable]: null,
})

// ====== READ
export const getLabel = A.prop(keys.label)
export const getVariable = A.prop(keys.variable)
export const getOrder = A.propOr(orders.asc, keys.order)
const isOrder = (order) => (sortCriteria) => getOrder(sortCriteria) === order
export const isOrderAsc = isOrder(orders.asc)
export const isOrderDesc = isOrder(orders.desc)

// ====== UPDATE
export const assocOrder = A.assoc(keys.order)
export const assocOrderAsc = assocOrder(orders.asc)
export const assocOrderDesc = assocOrder(orders.desc)
export const assocVariable =
  ({ label, variable }) =>
  (sort) => ({
    ...sort,
    [keys.label]: label,
    [keys.variable]: variable,
  })
