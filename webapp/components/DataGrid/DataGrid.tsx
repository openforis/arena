import { useCallback, useMemo } from 'react'
import {
  DataGrid as MuiDataGrid,
  DataGridProps,
  GridCellParams,
  GridColDef,
  GridDensity,
  GridEventListener,
  GridFooter,
  GridFooterContainer,
  GridInitialState,
  GridRowClassNameParams,
  GridRowIdGetter,
  GridRowSelectionModel,
  GridRowsProp,
  GridToolbarExport,
} from '@mui/x-data-grid'
import classNames from 'classnames'

import { isEventFromInteractiveChild } from '@webapp/utils/domUtils'

type Props<R extends object> = {
  allowExportToCsv?: boolean
  autoHeight?: boolean
  autoPageSize?: boolean
  autoRowHeight?: boolean
  checkboxSelection?: boolean
  className?: string
  columns: GridColDef[]
  density?: GridDensity
  exportFileName?: string
  getRowClassName?: (params: GridRowClassNameParams) => string
  getRowId?: GridRowIdGetter
  hideFooterPagination?: boolean
  initialState?: GridInitialState
  isRowOpenable?: (row: R) => boolean
  isRowSelectable?: DataGridProps['isRowSelectable']
  onRowOpen?: (row: R) => void
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void
  rows: readonly R[]
  rowSelectionModel?: GridRowSelectionModel
}

const FooterWithExport =
  ({ exportFileName }: { exportFileName?: string }) =>
  () => (
    <GridFooterContainer>
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} csvOptions={{ fileName: exportFileName }} />
      <GridFooter />
    </GridFooterContainer>
  )

const DataGrid = <R extends object>(props: Props<R>) => {
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
    getRowClassName: getRowClassNameProp,
    getRowId,
    hideFooterPagination = false,
    initialState,
    isRowOpenable,
    isRowSelectable,
    onRowOpen,
    onRowSelectionModelChange,
    rows,
    rowSelectionModel,
  } = props

  const columns = useMemo(() => columnsProp.map((col) => ({ ...col, disableColumnMenu: true })), [columnsProp])

  const getRowHeight = useMemo(() => (autoRowHeight ? () => 'auto' as const : undefined), [autoRowHeight])

  // same behavior as the Table component: with selection, click selects and double click opens; otherwise click opens
  const isOpenable = useCallback(
    (row: R): boolean => Boolean(onRowOpen) && (isRowOpenable?.(row) ?? true),
    [isRowOpenable, onRowOpen]
  )

  const onRowOpenEvent = useCallback<GridEventListener<'rowClick'>>(
    ({ row }, event) => {
      if (isOpenable(row) && !isEventFromInteractiveChild(event)) onRowOpen?.(row)
    },
    [isOpenable, onRowOpen]
  )

  const onCellKeyDown = useCallback<GridEventListener<'cellKeyDown'>>(
    ({ row }: GridCellParams, event) => {
      if (event.key === 'Enter' && isOpenable(row) && !isEventFromInteractiveChild(event)) onRowOpen?.(row)
    },
    [isOpenable, onRowOpen]
  )

  const getRowClassName = useCallback(
    (params: GridRowClassNameParams): string =>
      classNames(getRowClassNameProp?.(params), {
        'data-grid__row--clickable': checkboxSelection || isOpenable(params.row),
      }),
    [checkboxSelection, getRowClassNameProp, isOpenable]
  )

  return (
    <MuiDataGrid
      autoHeight={autoHeight}
      autoPageSize={autoPageSize}
      checkboxSelection={checkboxSelection}
      className={classNames('data-grid', className)}
      columns={columns}
      density={density}
      disableRowSelectionOnClick={!checkboxSelection}
      getRowClassName={getRowClassName}
      getRowHeight={getRowHeight}
      getRowId={getRowId}
      hideFooterPagination={hideFooterPagination}
      initialState={initialState}
      isRowSelectable={isRowSelectable}
      onCellKeyDown={onCellKeyDown}
      onRowClick={checkboxSelection ? undefined : onRowOpenEvent}
      onRowDoubleClick={checkboxSelection ? onRowOpenEvent : undefined}
      onRowSelectionModelChange={onRowSelectionModelChange}
      rows={rows as GridRowsProp}
      rowSelectionModel={rowSelectionModel}
      slots={allowExportToCsv ? { footer: FooterWithExport({ exportFileName }) } : undefined}
    />
  )
}

export default DataGrid
