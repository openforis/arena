const asc = 'asc'
const desc = 'desc'

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
