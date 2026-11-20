import { ReactNode } from 'react'
import { GridColDef } from '@mui/x-data-grid'

import { ButtonDownload, ButtonIconDelete, ButtonIconEdit, ButtonIconMap } from '@webapp/components/buttons'

type RowActions<R> = {
  getDownloadUrl?: (row: R) => string
  onShowOnMap?: (row: R) => void
  onEdit?: (row: R) => void
  onDelete?: (row: R) => void
}

const actionColumn = <R,>(field: string, renderButton: (row: R) => ReactNode): GridColDef => ({
  field,
  headerName: '',
  width: 60,
  sortable: false,
  renderCell: ({ row }) => renderButton(row),
})

/**
 * Columns with the row buttons, in the same order in every table (download, show on map, edit, delete):
 * only the columns of the given actions.
 *
 * @param actions - The row actions.
 * @returns The columns.
 */
export const rowActionColumns = <R,>({
  getDownloadUrl,
  onShowOnMap,
  onEdit,
  onDelete,
}: RowActions<R>): GridColDef[] => [
  ...(getDownloadUrl
    ? [
        actionColumn<R>('download', (row) => (
          <ButtonDownload href={getDownloadUrl(row)} showLabel={false} variant="text" />
        )),
      ]
    : []),
  ...(onShowOnMap ? [actionColumn<R>('map', (row) => <ButtonIconMap onClick={() => onShowOnMap(row)} />)] : []),
  ...(onEdit ? [actionColumn<R>('edit', (row) => <ButtonIconEdit onClick={() => onEdit(row)} />)] : []),
  ...(onDelete ? [actionColumn<R>('delete', (row) => <ButtonIconDelete onClick={() => onDelete(row)} />)] : []),
]
