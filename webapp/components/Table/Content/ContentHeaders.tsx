import { ContentHeader } from './ContentHeader'

type ContentHeadersProps = {
  columns?: any[]
  deselectAllItems?: (...args: any[]) => any
  expandableRows?: boolean
  handleSortBy?: (...args: any[]) => any
  selectAllItems?: (...args: any[]) => any
  selectedItemsCount?: number
  sort?: Record<string, any>
  totalCount?: number
  allVisibleItemsSelected?: boolean
}

export const ContentHeaders = (props: ContentHeadersProps) => {
  const {
    columns,
    deselectAllItems,
    expandableRows = false,
    handleSortBy,
    selectedItemsCount,
    selectAllItems,
    sort,
    totalCount,
    allVisibleItemsSelected,
  } = props

  return (
    <>
      {/* expand/collapse toggle column */}
      {expandableRows && <div />}
      {columns.map((column) => (
        <ContentHeader
          key={column.key}
          column={column}
          deselectAllItems={deselectAllItems}
          handleSortBy={handleSortBy}
          selectAllItems={selectAllItems}
          selectedItemsCount={selectedItemsCount}
          sort={sort}
          totalCount={totalCount}
          allVisibleItemsSelected={allVisibleItemsSelected}
        />
      ))}
    </>
  )
}
