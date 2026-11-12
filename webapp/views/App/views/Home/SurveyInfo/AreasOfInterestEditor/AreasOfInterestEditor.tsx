import { useCallback, useState } from 'react'

import type { AreaOfInterestDescriptor } from '@openforis/arena-core'

import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'

import { Button, ButtonAdd } from '@webapp/components'
import { DataGrid, rowActionColumns } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useConfirmAsync } from '@webapp/components/hooks'
import { type SurveyFileRef, SurveyFilesMapPanel } from '@webapp/components/MapContainer/fileLayers'
import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

import { AreaOfInterestDialog } from './AreaOfInterestDialog'

type Props = {
  areasOfInterest: AreaOfInterestDescriptor[]
  readOnly: boolean
  setAreasOfInterest: (areasOfInterest: AreaOfInterestDescriptor[]) => void
}

type DialogState = { open: boolean; edited: AreaOfInterestDescriptor | null }

type MapPanelState = { header: string; surveyFiles: SurveyFileRef[] }

const isSameArea = (areaA: AreaOfInterestDescriptor | null) => (areaB: AreaOfInterestDescriptor) =>
  areaA?.fileUuid === areaB.fileUuid

const toSurveyFileRef =
  (lang: string) =>
  (area: AreaOfInterestDescriptor): SurveyFileRef => ({
    fileUuid: area.fileUuid,
    fileName: area.fileName,
    label: SurveyAreaOfInterest.getLabel(lang)(area),
  })

export const AreasOfInterestEditor = (props: Props) => {
  const { areasOfInterest = [], readOnly, setAreasOfInterest } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const confirm = useConfirmAsync()
  const canUseMap = useAuthCanUseMap()

  const [dialog, setDialog] = useState<DialogState>({ open: false, edited: null })
  const [mapPanel, setMapPanel] = useState<MapPanelState | null>(null)

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

  const onShowOnMap = useCallback(
    (areaOfInterest: AreaOfInterestDescriptor) =>
      setMapPanel({
        header: SurveyAreaOfInterest.getLabel(lang)(areaOfInterest),
        surveyFiles: [toSurveyFileRef(lang)(areaOfInterest)],
      }),
    [lang]
  )

  const onShowAllOnMap = useCallback(
    () =>
      setMapPanel({
        header: 'homeView:surveyInfo.areasOfInterest.title',
        surveyFiles: areasOfInterest.map(toSurveyFileRef(lang)),
      }),
    [areasOfInterest, lang]
  )

  return (
    <fieldset className="survey-info__areas-of-interest">
      <legend>{i18n.t('homeView:surveyInfo.areasOfInterest.title')}</legend>
      <p>{i18n.t('homeView:surveyInfo.areasOfInterest.info')}</p>
      <div className="survey-info__areas-of-interest-buttons">
        {!readOnly && <ButtonAdd onClick={() => setDialog({ open: true, edited: null })} size="small" />}
        {canUseMap && areasOfInterest.length > 0 && (
          <Button
            iconClassName="icon-map icon-12px"
            label="homeView:surveyInfo.areasOfInterest.showAllOnMap"
            onClick={onShowAllOnMap}
            size="small"
          />
        )}
      </div>
      <DataGrid
        columns={[
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
          ...rowActionColumns<AreaOfInterestDescriptor>({
            getDownloadUrl: (areaOfInterest) =>
              API.getSurveyFileDownloadUrl({ surveyId, fileUuid: areaOfInterest.fileUuid }),
            onShowOnMap: canUseMap ? onShowOnMap : undefined,
            onEdit: readOnly ? undefined : onEdit,
            onDelete: readOnly ? undefined : onDelete,
          }),
        ]}
        density="compact"
        getRowId={(row) => row.fileUuid}
        hideFooterPagination
        onRowOpen={readOnly ? undefined : onEdit}
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
      {mapPanel && (
        <SurveyFilesMapPanel
          header={mapPanel.header}
          onClose={() => setMapPanel(null)}
          surveyFiles={mapPanel.surveyFiles}
        />
      )}
    </fieldset>
  )
}
