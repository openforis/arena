import * as A from '@core/arena'

const keys = {
  order: 'order',
  variable: 'variable',
}

const orders = {
  asc: 'asc',
  desc: 'desc',
}

export const create = () => ({
  [keys.order]: null,
  [keys.variable]: null,
})

// ====== READ
const getOrder = A.propOr(orders.asc, keys.order)
const isOrder = (order) => (sortCriteria) => getOrder(sortCriteria) === order
export const isOrderAsc = isOrder(orders.asc)
export const isOrderDesc = isOrder(orders.desc)
export const getVariable = A.prop(keys.variable)

// ====== UPDATE
const assocOrder = A.assoc(keys.order)
export const assocOrderAsc = assocOrder(orders.asc)
export const assocOrderDesc = assocOrder(orders.desc)
export const assocVariable = A.assoc(keys.variable)
