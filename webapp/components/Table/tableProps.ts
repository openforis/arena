import type { ElementType } from 'react'

// row settings passed by the table to its content and rows
export type TableRowsProps = {
  cellProps?: Record<string, any>
  cellTestIdExtractor?: (...args: any[]) => any
  columns?: any[]
  expandableRows?: boolean
  gridTemplateColumns?: string
  isRowActive?: (...args: any[]) => any // Checks whether a row must be highlighted
  isRowExpandable?: (...args: any[]) => any // Checks if a row rendering an item can be expanded
  isRowOpenable?: (...args: any[]) => any // Checks if the item of a row can be opened (onRowOpen); rows that cannot be opened do nothing on click
  module?: string
  onRowOpen?: (...args: any[]) => any // Opens (views or edits) the item of a row: on click, or on double click if the table is selectable
  rowComponent?: ElementType
  rowExpandedComponent?: ElementType
  rowProps?: Record<string, any>
  selectable?: boolean // if true, a row click selects the row and selectedItems is passed to the HeaderLeft component
}

// items selection and sorting, passed by the table content to the column headers
export type TableSelectionSortProps = {
  allVisibleItemsSelected?: boolean
  deselectAllItems?: (...args: any[]) => any
  handleSortBy?: (...args: any[]) => any
  selectAllItems?: (...args: any[]) => any
  selectedItemsCount?: number
  sort?: Record<string, any>
  totalCount?: number
}
