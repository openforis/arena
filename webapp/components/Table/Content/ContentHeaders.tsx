import { ContentHeader } from './ContentHeader'
import type { TableSelectionSortProps } from '../tableProps'

type ContentHeadersProps = TableSelectionSortProps & {
  columns?: any[]
  expandableRows?: boolean
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
