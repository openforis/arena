export const SortOrder = {
  asc: 'asc',
  desc: 'desc',
} as const

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]
