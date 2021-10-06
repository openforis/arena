import React from 'react'
import PropTypes from 'prop-types'

import * as ObjectUtils from '@core/objectUtils'

import Header from './Header'
import Content from './Content'
import { useTable } from './useTable'
import LoadingBar from '../LoadingBar'

const Table = (props) => {
  const {
    className,
    gridTemplateColumns,
    headerLeftComponent,
    isRowActive,
    keyExtractor,
    module,
    moduleApiUri,
    noItemsLabelKey,
    noItemsLabelForSearchKey,
    onRowClick,
    restParams,
    rowComponent,
    rowExpandedComponent,
    rowHeaderComponent,
    headerProps,
    rowProps,
    columns,
    expandableRows,
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
  } = useTable({
    moduleApiUri,
    module,
    restParams,
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
      />

      <Content
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        keyExtractor={keyExtractor}
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
        rowComponent={rowComponent}
        rowExpandedComponent={rowExpandedComponent}
        rowHeaderComponent={rowHeaderComponent}
        columns={columns}
        rowProps={rowProps}
        expandableRows={expandableRows}
        initData={initData}
        sort={sort}
        handleSortBy={handleSortBy}
      />
    </div>
  )
}

const DummyComponent = () => <div />

Table.propTypes = {
  className: PropTypes.string,
  gridTemplateColumns: PropTypes.string,
  headerLeftComponent: PropTypes.elementType,
  isRowActive: PropTypes.func, // Checks whether a row must be highlighted
  keyExtractor: PropTypes.func,
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string,
  noItemsLabelKey: PropTypes.string,
  noItemsLabelForSearchKey: PropTypes.string,
  onRowClick: PropTypes.func, // Row click handler
  restParams: PropTypes.object,
  rowComponent: PropTypes.elementType,
  rowExpandedComponent: PropTypes.elementType,
  rowHeaderComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  headerProps: PropTypes.object,
  columns: PropTypes.array,
  expandableRows: PropTypes.bool,
}

Table.defaultProps = {
  className: '',
  gridTemplateColumns: '1fr',
  headerLeftComponent: DummyComponent,
  isRowActive: null,
  keyExtractor: ({ item }) => ObjectUtils.getUuid(item),
  moduleApiUri: null,
  noItemsLabelKey: 'common.noItems',
  noItemsLabelForSearchKey: 'common.noItems',
  onRowClick: null,
  restParams: {},
  rowHeaderComponent: DummyComponent,
  rowComponent: DummyComponent,
  rowExpandedComponent: DummyComponent,
  rowProps: {},
  headerProps: {},
  columns: null,
  expandableRows: false,
}

export default Table
