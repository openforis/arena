import React, { useMemo } from 'react'
import { DataGrid as MuiDataGrid, GridFooter, GridFooterContainer, GridToolbarExport } from '@mui/x-data-grid'
import PropTypes from 'prop-types'
import classNames from 'classnames'

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
    allowExportToCsv = false,
    autoPageSize = false,
    autoRowHeight = false,
    checkboxSelection = false,
    className,
    columns: columnsProp,
    density = 'standard',
    exportFileName,
    disableSelectionOnClick = true,
    getRowClassName,
    getRowId,
    initialState,
    rows,
  } = props

  const columns = useMemo(() => columnsProp.map((col) => ({ ...col, disableColumnMenu: true })), [columnsProp])

  const getRowHeight = useMemo(() => (autoRowHeight ? () => 'auto' : undefined), [autoRowHeight])

  return (
    <MuiDataGrid
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      className={classNames('data-grid', className)}
      columns={columns}
      density={density}
      disableRowSelectionOnClick={disableSelectionOnClick}
      getRowClassName={getRowClassName}
      getRowHeight={getRowHeight}
      getRowId={getRowId}
      initialState={initialState}
      rows={rows}
      slots={allowExportToCsv ? { footer: FooterWithExport({ exportFileName }) } : undefined}
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

export default DataGrid
