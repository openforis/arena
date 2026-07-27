import { useMemo, useState } from 'react'
import { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid'

import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'
import { RecordImportAction } from '@common/dataImport'

import { Button } from '@webapp/components'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { DataGrid } from '@webapp/components/DataGrid'
import { useI18n } from '@webapp/store/system'
import { useNodeDefRootKeys, useSurveyPreferredLang } from '@webapp/store/survey'

type PreviewItem = {
  recordUuid: string
  keyValues: { [nodeDefUuid: string]: any }
  existingRecordUuid: string | null
  action: string
  dateModified: string | null
  existingDateModified: string | null
}

type Props = {
  items: PreviewItem[]
  onCancel: () => void
  onConfirm: (selectedRecordsUuids: string[]) => void
}

const formatDate = (date: string | null) => (date ? DateUtils.formatDateTimeDisplay(date) : '')

export const ArenaImportPreviewDialog = (props: Props) => {
  const { items, onCancel, onConfirm } = props

  const i18n = useI18n()
  const nodeDefKeys = useNodeDefRootKeys()
  const lang = useSurveyPreferredLang()

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(() => ({
    type: 'include',
    ids: new Set(items.filter((item) => item.action !== RecordImportAction.skip).map((item) => item.recordUuid)),
  }))

  const columns: GridColDef[] = useMemo(
    () => [
      ...nodeDefKeys.map((nodeDef: any) => ({
        field: NodeDef.getUuid(nodeDef),
        headerName: NodeDef.getLabel(nodeDef, lang),
        flex: 1,
        valueGetter: (_value: any, row: PreviewItem) => row.keyValues[NodeDef.getUuid(nodeDef)],
      })),
      {
        field: 'exists',
        headerName: i18n.t('dataImportView:importPreview.columns.exists'),
        flex: 0.5,
        valueGetter: (_value: any, row: PreviewItem) => i18n.t(row.existingRecordUuid ? 'common.yes' : 'common.no'),
      },
      {
        field: 'action',
        headerName: i18n.t('dataImportView:importPreview.columns.action'),
        flex: 0.7,
        valueGetter: (_value: any, row: PreviewItem) => i18n.t(`dataImportView:importPreview.action.${row.action}`),
      },
      {
        field: 'existingDateModified',
        headerName: i18n.t('dataImportView:importPreview.columns.existingDateModified'),
        flex: 1,
        valueGetter: (_value: any, row: PreviewItem) => formatDate(row.existingDateModified),
      },
      {
        field: 'dateModified',
        headerName: i18n.t('dataImportView:importPreview.columns.dateModified'),
        flex: 1,
        valueGetter: (_value: any, row: PreviewItem) => formatDate(row.dateModified),
      },
    ],
    [i18n, lang, nodeDefKeys]
  )

  const selectedCount =
    selectionModel.type === 'include' ? selectionModel.ids.size : items.length - selectionModel.ids.size

  return (
    <Modal
      className="arena-import-preview-dialog"
      onClose={onCancel}
      showCloseButton
      title="dataImportView:importPreview.title"
    >
      <ModalBody>
        <p>{i18n.t('dataImportView:importPreview.skipInfo')}</p>
        <DataGrid
          autoHeight
          checkboxSelection
          columns={columns}
          getRowId={(row: any) => row.recordUuid}
          onRowSelectionModelChange={setSelectionModel}
          rows={items}
          rowSelectionModel={selectionModel}
        />
      </ModalBody>
      <ModalFooter>
        <Button label="common.cancel" onClick={onCancel} variant="outlined" />
        <Button
          disabled={selectedCount === 0}
          label="dataImportView:importPreview.confirmImport"
          labelParams={{ count: selectedCount }}
          onClick={() => {
            const selectedRecordsUuids =
              selectionModel.type === 'include'
                ? Array.from(selectionModel.ids as Set<string>)
                : items.map((item) => item.recordUuid).filter((recordUuid) => !selectionModel.ids.has(recordUuid))
            onConfirm(selectedRecordsUuids)
          }}
          variant="contained"
        />
      </ModalFooter>
    </Modal>
  )
}
