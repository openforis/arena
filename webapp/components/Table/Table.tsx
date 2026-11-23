import type React from 'react'
import classNames from 'classnames'

import * as ObjectUtils from '@core/objectUtils'

import LoadingBar from '../LoadingBar'

import Header from './Header'
import Content from './Content'
import { Footer } from './Footer'
import { useTable } from './useTable'
import type { TableRowsProps } from './tableProps'

// default props as constants: new objects or functions at every render would re-render all the (memoized) rows
const defaultKeyExtractor = ({ item }) => ObjectUtils.getUuid(item)
const defaultIsRowExpandable = () => true
const emptyProps = {}

type TableProps = Omit<TableRowsProps, 'module'> & {
  className?: string
  headerLeftComponent?: React.ElementType
  headerProps?: Record<string, any>
  keepSelectionOnSearch?: boolean // if true, selected items are kept when the search text changes
  keyExtractor?: (...args: any[]) => any
  module: string
  moduleApiUri?: string
  noItemsLabelKey?: string
  noItemsLabelForSearchKey?: string
  restParams?: Record<string, any>
  rowHeaderComponent?: React.ElementType
  showFooter?: boolean
  showHeader?: boolean
  visibleColumnsSelectionEnabled?: boolean // if true, visible columns selection menu button will be shown
}

const Table = (props: TableProps) => {
  const {
    cellProps = emptyProps,
    cellTestIdExtractor = null,
    className = '',
    columns = null,
    expandableRows = false,
    gridTemplateColumns = '1fr',
    headerLeftComponent = DummyComponent,
    headerProps = emptyProps,
    isRowActive = null,
    isRowExpandable = defaultIsRowExpandable,
    isRowOpenable = null,
    keepSelectionOnSearch = false,
    keyExtractor = defaultKeyExtractor,
    module,
    moduleApiUri = null,
    noItemsLabelKey = 'common.noItems',
    noItemsLabelForSearchKey = 'common.noItems',
    onRowOpen = null,
    restParams = emptyProps,
    rowHeaderComponent = DummyComponent,
    rowComponent = DummyComponent,
    rowExpandedComponent = DummyComponent,
    rowProps = emptyProps,
    selectable = false,
    showFooter = true,
    showHeader = true,
    visibleColumnsSelectionEnabled = false,
  } = props

  const {
    loadingData,
    loadingCount,
    list,
    offset,
    limit,
    sort,
    search,
    handleSortBy,
    handleSearch,
    count,
    totalCount,
    initData,
    onVisibleColumnsChange,
    selectedItems,
    selectAllItems,
    deselectAllItems,
    toggleItemSelection,
    visibleColumnKeys,
    visibleColumns,
    allVisibleItemsSelected,
  } = useTable({
    columns,
    keyExtractor,
    moduleApiUri,
    module,
    restParams,
    keepSelectionOnSearch,
  })

  if (loadingCount && totalCount <= 0) {
    return <LoadingBar />
  }

  return (
    <div className={classNames('table', className, { 'with-footer': showFooter })}>
      {showHeader && (
        <Header
          columns={columns}
          offset={offset}
          list={list}
          limit={limit}
          count={count}
          totalCount={totalCount}
          search={search}
          headerLeftComponent={headerLeftComponent}
          headerProps={headerProps}
          handleSearch={handleSearch}
          onVisibleColumnsChange={onVisibleColumnsChange}
          selectedItems={selectedItems}
          visibleColumnsSelectionEnabled={visibleColumnsSelectionEnabled}
          visibleColumnKeys={visibleColumnKeys}
        />
      )}

      <Content
        cellProps={cellProps}
        cellTestIdExtractor={cellTestIdExtractor}
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        keyExtractor={keyExtractor}
        isRowExpandable={isRowExpandable}
        isRowOpenable={isRowOpenable}
        list={list}
        loading={loadingData}
        maxRows={limit}
        module={module}
        totalCount={totalCount}
        noItemsLabelKey={noItemsLabelKey}
        noItemsLabelForSearchKey={noItemsLabelForSearchKey}
        offset={offset}
        onItemSelectToggle={toggleItemSelection}
        onRowOpen={onRowOpen}
        rowComponent={rowComponent}
        rowExpandedComponent={rowExpandedComponent}
        rowHeaderComponent={rowHeaderComponent}
        columns={visibleColumns}
        rowProps={rowProps}
        selectable={selectable}
        expandableRows={expandableRows}
        initData={initData}
        sort={sort}
        handleSortBy={handleSortBy}
        selectedItems={selectedItems}
        selectAllItems={selectAllItems}
        deselectAllItems={deselectAllItems}
        allVisibleItemsSelected={allVisibleItemsSelected}
      />
      {showFooter && (
        <Footer
          count={count}
          limit={limit}
          list={list}
          module={module}
          offset={offset}
          selectedItemsCount={selectedItems.length}
        />
      )}
    </div>
  )
}

const DummyComponent = () => <div />

export default Table
