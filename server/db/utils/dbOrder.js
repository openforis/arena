import { SortOrder } from '@core/sortOrder'

const { asc, desc } = SortOrder

const isAsc = (order) => order?.toLowerCase() === asc
const isDesc = (order) => order?.toLowerCase() === desc
const normalize = (order, defaultValue = asc) => (isAsc(order ?? defaultValue) ? asc : desc)

export const DbOrder = {
  asc,
  desc,
  isAsc,
  isDesc,
  normalize,
}
