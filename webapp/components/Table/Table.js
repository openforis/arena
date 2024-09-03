import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'

import LoadingBar from '../LoadingBar'

import Header from './Header'
import Content from './Content'
import { Footer } from './Footer'
import { useTable } from './useTable'

const Table = (props) => {
  const {
    cellProps = {},
    cellTestIdExtractor = null,
    className = '',
    columns = null,
    expandableRows = false,
    gridTemplateColumns = '1fr',
    headerLeftComponent = DummyComponent,
    headerProps = {},
    isRowActive = null,
    isRowExpandable = () => true,
    keyExtractor = ({ item }) => ObjectUtils.getUuid(item),
    module,
    moduleApiUri = null,
    noItemsLabelKey = 'common.noItems',
    noItemsLabelForSearchKey = 'common.noItems',
    onRowClick: onRowClickProp = null,
    onRowDoubleClick = null,
    restParams = {},
    rowHeaderComponent = DummyComponent,
    rowComponent = DummyComponent,
    rowExpandedComponent = DummyComponent,
    rowProps = {},
    selectable = true,
    selectOnClick = true,
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
    onRowClick,
    onRowsScroll,
    onVisibleColumnsChange,
    selectedItems,
    visibleColumnKeys,
    visibleColumns,
  } = useTable({
    columns,
    keyExtractor,
    moduleApiUri,
    module,
    onRowClick: onRowClickProp,
    restParams,
    selectable,
    selectOnClick,
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
        onRowsScroll={onRowsScroll}
        rowComponent={rowComponent}
        rowExpandedComponent={rowExpandedComponent}
        rowHeaderComponent={rowHeaderComponent}
        columns={visibleColumns}
        rowProps={rowProps}
        expandableRows={expandableRows}
        initData={initData}
        sort={sort}
        handleSortBy={handleSortBy}
        selectedItems={selectedItems}
      />
      {showFooter && <Footer count={count} limit={limit} list={list} module={module} offset={offset} />}
    </div>
  )
}

const DummyComponent = () => <div />

Table.propTypes = {
  cellProps: PropTypes.object,
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
  selectOnClick: PropTypes.bool,
  showFooter: PropTypes.bool,
  showHeader: PropTypes.bool,
  visibleColumnsSelectionEnabled: PropTypes.bool, // if true, visible columns selection menu button will be shown
}

export default Table
