import React from 'react'
import { DataGrid as MuiDataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'
import PropTypes from 'prop-types'

const DataGrid = (props) => {
  const { allowExportToCsv, autoPageSize, checkboxSelection, columns, disableSelectionOnClick, getRowId, rows } = props

  const Toolbar = allowExportToCsv
    ? () => (
        <GridToolbarContainer>
          <GridToolbarExport />
        </GridToolbarContainer>
      )
    : undefined

  return (
    <MuiDataGrid
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      columns={columns}
      disableSelectionOnClick={disableSelectionOnClick}
      getRowId={getRowId}
      rows={rows}
      components={{ Toolbar }}
    />
  )
}

DataGrid.propTypes = {
  allowExportToCsv: PropTypes.bool,
  autoPageSize: PropTypes.bool,
  checkboxSelection: PropTypes.bool,
  columns: PropTypes.array.isRequired,
  disableSelectionOnClick: PropTypes.bool,
  getRowId: PropTypes.func,
  rows: PropTypes.array.isRequired,
}

DataGrid.defaultProps = {
  allowExportToCsv: false,
  autoPageSize: false,
  checkboxSelection: false,
  disableSelectionOnClick: true,
  getRowId: undefined,
}

export default DataGrid
