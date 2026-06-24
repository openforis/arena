import { useMemo } from 'react'
import {
  DataGrid as MuiDataGrid,
  DataGridProps,
  GridColDef,
  GridDensity,
  GridFooter,
  GridFooterContainer,
  GridInitialState,
  GridRowClassNameParams,
  GridRowIdGetter,
  GridRowsProp,
  GridToolbarExport,
} from '@mui/x-data-grid'
import classNames from 'classnames'

type Props = {
  allowExportToCsv?: boolean
  autoHeight?: boolean
  autoPageSize?: boolean
  autoRowHeight?: boolean
  checkboxSelection?: boolean
  className?: string
  columns: GridColDef[]
  density?: GridDensity
  disableSelectionOnClick?: boolean
  exportFileName?: string
  getRowClassName?: (params: GridRowClassNameParams) => string
  getRowId?: GridRowIdGetter
  hideFooterPagination?: boolean
  initialState?: GridInitialState
  onRowDoubleClick?: DataGridProps['onRowDoubleClick']
  rows: GridRowsProp
}

const FooterWithExport =
  ({ exportFileName }: { exportFileName?: string }) =>
  () => (
    <GridFooterContainer>
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} csvOptions={{ fileName: exportFileName }} />
      <GridFooter />
    </GridFooterContainer>
  )

const DataGrid = (props: Props) => {
  const {
    allowExportToCsv = false,
    autoHeight = false,
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
    hideFooterPagination = false,
    initialState,
    onRowDoubleClick,
    rows,
  } = props

  const columns = useMemo(() => columnsProp.map((col) => ({ ...col, disableColumnMenu: true })), [columnsProp])

  const getRowHeight = useMemo(() => (autoRowHeight ? () => 'auto' as const : undefined), [autoRowHeight])

  return (
    <MuiDataGrid
      autoHeight={autoHeight}
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      className={classNames('data-grid', className)}
      columns={columns}
      density={density}
      disableRowSelectionOnClick={disableSelectionOnClick}
      getRowClassName={getRowClassName}
      getRowHeight={getRowHeight}
      getRowId={getRowId}
      hideFooterPagination={hideFooterPagination}
      initialState={initialState}
      onRowDoubleClick={onRowDoubleClick}
      rows={rows}
      slots={allowExportToCsv ? { footer: FooterWithExport({ exportFileName }) } : undefined}
    />
  )
}

export default DataGrid
