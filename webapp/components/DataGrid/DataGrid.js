import React, { useMemo } from 'react'
import { DataGrid as MuiDataGrid, GridFooter, GridFooterContainer, GridToolbarExport } from '@mui/x-data-grid'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const FooterWithExport = () => (
  <GridFooterContainer>
    <GridToolbarExport printOptions={{ disableToolbarButton: true }} />
    <GridFooter />
  </GridFooterContainer>
)

const DataGrid = (props) => {
  const {
    allowExportToCsv,
    autoPageSize,
    checkboxSelection,
    className,
    columns: columnsProp,
    density,
    disableSelectionOnClick,
    getRowClassName,
    getRowId,
    initialState,
    rows,
  } = props

  const components = {
    ...(allowExportToCsv ? { Footer: FooterWithExport } : {}),
  }

  const columns = useMemo(() => columnsProp.map((col) => ({ ...col, disableColumnMenu: true })), [columnsProp])

  return (
    <MuiDataGrid
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      className={classNames('data-grid', className)}
      columns={columns}
      components={components}
      density={density}
      disableSelectionOnClick={disableSelectionOnClick}
      getRowClassName={getRowClassName}
      getRowId={getRowId}
      initialState={initialState}
      rows={rows}
    />
  )
}

DataGrid.propTypes = {
  allowExportToCsv: PropTypes.bool,
  autoPageSize: PropTypes.bool,
  checkboxSelection: PropTypes.bool,
  className: PropTypes.string,
  columns: PropTypes.array.isRequired,
  density: PropTypes.oneOf(['comfortable', 'compact', 'standard']),
  disableSelectionOnClick: PropTypes.bool,
  getRowClassName: PropTypes.func,
  getRowId: PropTypes.func,
  initialState: PropTypes.object,
  rows: PropTypes.array.isRequired,
}

DataGrid.defaultProps = {
  allowExportToCsv: false,
  autoPageSize: false,
  checkboxSelection: false,
  density: 'standard',
  disableSelectionOnClick: true,
}

export default DataGrid
