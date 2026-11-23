export type TableColumn = {
  key: string
  header?: string
  renderHeader?: (...args: any[]) => any
  headerIsTranslationKey?: boolean
  sortable?: boolean
  sortField?: string
  renderItem?: (...args: any[]) => any
  width?: string
  className?: string
}
