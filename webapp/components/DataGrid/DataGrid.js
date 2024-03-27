import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { DataGrid as MuiDataGrid, GridFooter, GridFooterContainer, GridToolbarExport } from '@mui/x-data-grid'

const FooterWithExport =
  ({ exportFileName }) =>
  () => (
    <GridFooterContainer>
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} csvOptions={{ fileName: exportFileName }} />
      <GridFooter />
    </GridFooterContainer>
  )

const DataGrid = (props) => {
  const {
    allowExportToCsv,
    autoPageSize,
    autoRowHeight,
    checkboxSelection,
    className,
    columns: columnsProp,
    density,
    exportFileName,
    disableSelectionOnClick,
    getRowClassName,
    getRowId,
    initialState,
    rows,
  } = props

  const components = {
    ...(allowExportToCsv ? { Footer: FooterWithExport({ exportFileName }) } : {}),
  }

  const columns = useMemo(() => columnsProp.map((col) => ({ ...col, disableColumnMenu: true })), [columnsProp])

  const getRowHeight = useMemo(() => (autoRowHeight ? () => 'auto' : undefined), [autoRowHeight])

  return (
    <MuiDataGrid
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      className={classNames('data-grid', className)}
      columns={columns}
      components={components}
      density={density}
      disableRowSelectionOnClick={disableSelectionOnClick}
      getRowClassName={getRowClassName}
      getRowHeight={getRowHeight}
      getRowId={getRowId}
      initialState={initialState}
      rows={rows}
    />
  )
}

DataGrid.propTypes = {
  allowExportToCsv: PropTypes.bool,
  autoPageSize: PropTypes.bool,
  autoRowHeight: PropTypes.bool,
  checkboxSelection: PropTypes.bool,
  className: PropTypes.string,
  columns: PropTypes.array.isRequired,
  density: PropTypes.oneOf(['comfortable', 'compact', 'standard']),
  disableSelectionOnClick: PropTypes.bool,
  exportFileName: PropTypes.string,
  getRowClassName: PropTypes.func,
  getRowId: PropTypes.func,
  initialState: PropTypes.object,
  rows: PropTypes.array.isRequired,
}

DataGrid.defaultProps = {
  allowExportToCsv: false,
  autoPageSize: false,
  autoRowHeight: false,
  checkboxSelection: false,
  density: 'standard',
  disableSelectionOnClick: true,
}

export default DataGrid
