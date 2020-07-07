import React from 'react'
import PropTypes from 'prop-types'

import Header from './Header'
import Content from './Content'
import { useTable } from './useTable'

const Table = (props) => {
  const {
    className,
    gridTemplateColumns,
    headerLeftComponent,
    isRowActive,
    module,
    moduleApiUri,
    noItemsLabelKey,
    onRowClick,
    restParams,
    rowComponent,
    rowHeaderComponent,
    headerProps,
    rowProps,
  } = props

  const { list, offset, limit, count } = useTable({ moduleApiUri, module, restParams })

  return (
    <div className={`table ${className}`}>
      <Header
        offset={offset}
        list={list}
        limit={limit}
        count={count}
        headerLeftComponent={headerLeftComponent}
        headerProps={headerProps}
      />

      <Content
        gridTemplateColumns={gridTemplateColumns}
        isRowActive={isRowActive}
        list={list}
        module={module}
        noItemsLabelKey={noItemsLabelKey}
        offset={offset}
        onRowClick={onRowClick}
        rowComponent={rowComponent}
        rowHeaderComponent={rowHeaderComponent}
        rowProps={rowProps}
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
  module: PropTypes.string.isRequired,
  moduleApiUri: PropTypes.string,
  noItemsLabelKey: PropTypes.string,
  onRowClick: PropTypes.func, // Row click handler
  restParams: PropTypes.object,
  rowComponent: PropTypes.elementType,
  rowHeaderComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  headerProps: PropTypes.object,
}

Table.defaultProps = {
  className: '',
  gridTemplateColumns: '1fr',
  headerLeftComponent: DummyComponent,
  isRowActive: null,
  moduleApiUri: null,
  noItemsLabelKey: 'common.noItems',
  onRowClick: null,
  restParams: {},
  rowHeaderComponent: DummyComponent,
  rowComponent: DummyComponent,
  rowProps: {},
  headerProps: {},
}

export default Table
