import { useCallback, useState } from 'react'

import type { AreaOfInterestDescriptor } from '@openforis/arena-core'

import { ButtonAdd, ButtonDownload, ButtonIconDelete, ButtonIconEdit } from '@webapp/components'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useConfirmAsync } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { AreaOfInterestDialog } from './AreaOfInterestDialog'

type Props = {
  areasOfInterest: AreaOfInterestDescriptor[]
  readOnly: boolean
  setAreasOfInterest: (areasOfInterest: AreaOfInterestDescriptor[]) => void
}

type DialogState = { open: boolean; edited: AreaOfInterestDescriptor | null }

const isSameArea = (areaA: AreaOfInterestDescriptor | null) => (areaB: AreaOfInterestDescriptor) =>
  areaA?.fileUuid === areaB.fileUuid

export const AreasOfInterestEditor = (props: Props) => {
  const { areasOfInterest = [], readOnly, setAreasOfInterest } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const confirm = useConfirmAsync()

  const [dialog, setDialog] = useState<DialogState>({ open: false, edited: null })

  const closeDialog = useCallback(() => setDialog({ open: false, edited: null }), [])

  const onDialogOk = useCallback(
    (areaOfInterest: AreaOfInterestDescriptor) => {
      const { edited } = dialog
      setAreasOfInterest(
        edited
          ? areasOfInterest.map((area) => (isSameArea(edited)(area) ? areaOfInterest : area))
          : [...areasOfInterest, areaOfInterest]
      )
      closeDialog()
    },
    [areasOfInterest, closeDialog, dialog, setAreasOfInterest]
  )

  const onEdit = useCallback(
    (areaOfInterest: AreaOfInterestDescriptor) => !readOnly && setDialog({ open: true, edited: areaOfInterest }),
    [readOnly]
  )

  const onDelete = useCallback(
    async (areaOfInterest: AreaOfInterestDescriptor) => {
      if (await confirm({ key: 'homeView:surveyInfo.areasOfInterest.confirmDelete' })) {
        setAreasOfInterest(areasOfInterest.filter((area) => !isSameArea(areaOfInterest)(area)))
      }
    },
    [areasOfInterest, confirm, setAreasOfInterest]
  )

  return (
    <fieldset className="survey-info__areas-of-interest">
      <legend>{i18n.t('homeView:surveyInfo.areasOfInterest.title')}</legend>
      <p>{i18n.t('homeView:surveyInfo.areasOfInterest.info')}</p>
      {!readOnly && <ButtonAdd onClick={() => setDialog({ open: true, edited: null })} size="small" />}
      <DataGrid
        columns={[
          ...(readOnly
            ? []
            : [
                {
                  field: 'edit',
                  width: 60,
                  headerName: '',
                  renderCell: ({ row }) => <ButtonIconEdit onClick={() => onEdit(row)} />,
                  sortable: false,
                },
              ]),
          {
            field: 'name',
            flex: 0.3,
            headerName: i18n.t('homeView:surveyInfo.areasOfInterest.name'),
            renderCell: ({ row }) => <LabelWithTooltip label={row.name} />,
            sortable: false,
          },
          {
            field: 'label',
            flex: 0.3,
            headerName: i18n.t('common.label'),
            renderCell: ({ row }) => <LabelWithTooltip label={row.labels?.[lang]} />,
            sortable: false,
          },
          {
            field: 'fileName',
            flex: 0.3,
            headerName: i18n.t('common:files.fileName'),
            renderCell: ({ row }) => <LabelWithTooltip label={row.fileName} />,
            sortable: false,
          },
          {
            field: 'download',
            width: 60,
            headerName: '',
            renderCell: ({ row }) => (
              <ButtonDownload
                href={API.getSurveyFileDownloadUrl({ surveyId, fileUuid: row.fileUuid })}
                showLabel={false}
                variant="text"
              />
            ),
            sortable: false,
          },
          {
            field: 'polygons',
            width: 100,
            headerName: i18n.t('homeView:surveyInfo.areasOfInterest.polygons'),
            sortable: false,
          },
          {
            field: 'vertices',
            width: 100,
            headerName: i18n.t('homeView:surveyInfo.areasOfInterest.vertices'),
            sortable: false,
          },
          ...(readOnly
            ? []
            : [
                {
                  field: 'delete',
                  width: 60,
                  headerName: '',
                  renderCell: ({ row }) => <ButtonIconDelete onClick={() => onDelete(row)} />,
                  sortable: false,
                },
              ]),
        ]}
        density="compact"
        getRowId={(row) => row.fileUuid}
        hideFooterPagination
        onRowDoubleClick={({ row }) => onEdit(row)}
        rows={areasOfInterest}
      />
      {dialog.open && (
        <AreaOfInterestDialog
          areasOfInterest={areasOfInterest.filter((area) => !isSameArea(dialog.edited)(area))}
          editedAreaOfInterest={dialog.edited}
          onClose={closeDialog}
          onOk={onDialogOk}
        />
      )}
    </fieldset>
  )
}
