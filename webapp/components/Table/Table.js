import React from 'react'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'

import LoadingBar from '../LoadingBar'

import Header from './Header'
import Content from './Content'
import { Footer } from './Footer'
import { useTable } from './useTable'

const Table = (props) => {
  const {
    cellTestIdExtractor,
    className,
    columns,
    expandableRows,
    gridTemplateColumns,
    headerLeftComponent,
    isRowExpandable,
    isRowActive,
    keyExtractor,
    module,
    moduleApiUri,
    noItemsLabelKey,
    noItemsLabelForSearchKey,
    onRowClick: onRowClickProp,
    onRowDoubleClick,
    restParams,
    rowComponent,
    rowExpandedComponent,
    rowHeaderComponent,
    headerProps,
    rowProps,
    selectable,
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
    onRowClick,
    selectedItems,
  } = useTable({
    keyExtractor,
    moduleApiUri,
    module,
    onRowClick: onRowClickProp,
    restParams,
    selectable,
  })

  if (loadingCount && totalCount <= 0) {
    return <LoadingBar />
  }

  return (
    <div className={`table ${className}`}>
      <Header
        offset={offset}
        list={list}
        limit={limit}
        count={count}
        totalCount={totalCount}
        search={search}
        headerLeftComponent={headerLeftComponent}
        headerProps={headerProps}
        handleSearch={handleSearch}
        selectedItems={selectedItems}
      />

      <Content
        cellTestIdExtractor={cellTestIdExtractor}
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        keyExtractor={keyExtractor}
        isRowExpandable={isRowExpandable}
        list={list}
        loading={loadingData}
        maxRows={limit}
        module={module}
        count={count}
        totalCount={totalCount}
        noItemsLabelKey={noItemsLabelKey}
        noItemsLabelForSearchKey={noItemsLabelForSearchKey}
        offset={offset}
        onRowClick={onRowClick}
        onRowDoubleClick={onRowDoubleClick}
        rowComponent={rowComponent}
        rowExpandedComponent={rowExpandedComponent}
        rowHeaderComponent={rowHeaderComponent}
        columns={columns}
        rowProps={rowProps}
        expandableRows={expandableRows}
        initData={initData}
        sort={sort}
        handleSortBy={handleSortBy}
        selectedItems={selectedItems}
      />
      <Footer offset={offset} list={list} limit={limit} count={count} />
    </div>
  )
}

const DummyComponent = () => <div />

Table.propTypes = {
  cellTestIdExtractor: PropTypes.func,
  className: PropTypes.string,
  columns: PropTypes.array,
  expandableRows: PropTypes.bool,
  gridTemplateColumns: PropTypes.string,
  headerLeftComponent: PropTypes.elementType,
  headerProps: PropTypes.object,
  isRowActive: PropTypes.func, // Checks whether a row must be highlighted
  isRowExpandable: PropTypes.func, // Checks if a row rendering an item can be expanded
  keyExtractor: PropTypes.func,
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string,
  noItemsLabelKey: PropTypes.string,
  noItemsLabelForSearchKey: PropTypes.string,
  onRowClick: PropTypes.func, // Row click handler
  onRowDoubleClick: PropTypes.func, // Row double click handler
  restParams: PropTypes.object,
  rowComponent: PropTypes.elementType,
  rowExpandedComponent: PropTypes.elementType,
  rowHeaderComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  selectable: PropTypes.bool, // if true, selectedItems will be updated on row click and passed to the HeaderLeft component
}

Table.defaultProps = {
  cellTestIdExtractor: null,
  className: '',
  columns: null,
  expandableRows: false,
  gridTemplateColumns: '1fr',
  headerLeftComponent: DummyComponent,
  headerProps: {},
  isRowActive: null,
  isRowExpandable: () => true,
  keyExtractor: ({ item }) => ObjectUtils.getUuid(item),
  moduleApiUri: null,
  noItemsLabelKey: 'common.noItems',
  noItemsLabelForSearchKey: 'common.noItems',
  onRowClick: null,
  onRowDoubleClick: null,
  restParams: {},
  rowHeaderComponent: DummyComponent,
  rowComponent: DummyComponent,
  rowExpandedComponent: DummyComponent,
  rowProps: {},
  selectable: true,
}

export default Table
