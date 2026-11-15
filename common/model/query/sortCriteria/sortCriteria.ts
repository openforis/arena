import * as A from '@core/arena'
import { SortOrder } from '@core/sortOrder'

const keys = {
  label: 'label',
  order: 'order',
  variable: 'variable',
} as const

export interface SortCriteriaItem {
  label?: string | null
  // any string: it can come from the client (see Sort.toSql)
  order?: string | null
  variable?: string | null
}

type SortCriteriaUpdater = (sortCriteria: SortCriteriaItem) => SortCriteriaItem

export const orders = SortOrder

export const create = (): SortCriteriaItem => ({
  [keys.label]: null,
  [keys.order]: null,
  [keys.variable]: null,
})

// ====== READ
export const getLabel = (sortCriteria: SortCriteriaItem): string | null => A.prop(keys.label)(sortCriteria)
export const getVariable = (sortCriteria: SortCriteriaItem): string | null => A.prop(keys.variable)(sortCriteria)
export const getOrder = (sortCriteria: SortCriteriaItem): string => A.propOr(orders.asc, keys.order)(sortCriteria)
const isOrder = (order: string) => (sortCriteria: SortCriteriaItem) => getOrder(sortCriteria) === order
export const isOrderAsc = isOrder(orders.asc)
export const isOrderDesc = isOrder(orders.desc)

// ====== UPDATE
export const assocOrder =
  (order: string): SortCriteriaUpdater =>
  (sortCriteria) =>
    A.assoc(keys.order, order)(sortCriteria)
export const assocOrderAsc = assocOrder(orders.asc)
export const assocOrderDesc = assocOrder(orders.desc)
export const assocVariable =
  ({ label, variable }: { label: string; variable: string }): SortCriteriaUpdater =>
  (sort) => ({
    ...sort,
    [keys.label]: label,
    [keys.variable]: variable,
  })
