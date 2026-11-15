import { SortOrder } from '@core/sortOrder'

const { asc, desc } = SortOrder

const isAsc = (order: string | null | undefined): boolean => order?.toLowerCase() === asc
const isDesc = (order: string | null | undefined): boolean => order?.toLowerCase() === desc
const normalize = (order: string | null | undefined, defaultValue: string = asc): SortOrder =>
  isAsc(order ?? defaultValue) ? asc : desc

export const DbOrder = {
  asc,
  desc,
  isAsc,
  isDesc,
  normalize,
}
