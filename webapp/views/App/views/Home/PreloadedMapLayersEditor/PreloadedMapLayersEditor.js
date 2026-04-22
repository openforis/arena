import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as SurveyFile from '@core/survey/surveyFile'
import * as DateUtils from '@core/dateUtils'

import { ButtonAdd, ButtonDownload, ButtonIconDelete, ButtonIconEdit } from '@webapp/components'
import { useConfirmAsync } from '@webapp/components/hooks'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import * as API from '@webapp/service/api'

import PreloadedMapLayerEditor from './PreloadedMapLayerEditor'

const PreloadedMapLayersEditor = (props) => {
  const { preloadedMapLayers, setPreloadedMapLayers, readOnly } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const confirm = useConfirmAsync()

  const [preloadedLayerDialogVisible, setPreloadedLayerDialogVisible] = useState(false)
  const [editedPreloadedMapLayer, setEditedPreloadedMapLayer] = useState(null)

  const onAddClick = useCallback(() => {
    setPreloadedLayerDialogVisible(true)
  }, [])

  const onPreloadedLayerDialogClose = useCallback(() => {
    setPreloadedLayerDialogVisible(false)
    setEditedPreloadedMapLayer(null)
  }, [])

  const onPreloadedLayerDialogOk = useCallback(
    async ({ file, surveyFile }) => {
      setPreloadedLayerDialogVisible(false)
      setEditedPreloadedMapLayer(null)

      const preloadedMapLayersNext = editedPreloadedMapLayer
        ? preloadedMapLayers.map((l) =>
            SurveyFile.getUuid(l) === SurveyFile.getUuid(editedPreloadedMapLayer) ? surveyFile : l
          )
        : [...(preloadedMapLayers ?? []), surveyFile]
      if (!editedPreloadedMapLayer) {
        await API.insertSurveyFile({ surveyId, file, surveyFile })
      }
      setPreloadedMapLayers(preloadedMapLayersNext)
    },
    [editedPreloadedMapLayer, preloadedMapLayers, setPreloadedMapLayers, surveyId]
  )

  const onDeleteClick = useCallback(
    ({ preloadedMapLayer }) =>
      async () => {
        if (await confirm({ key: 'homeView:surveyInfo.preloadedMapLayers.confirmDelete' })) {
          setPreloadedMapLayers(
            preloadedMapLayers.filter((l) => SurveyFile.getUuid(l) !== SurveyFile.getUuid(preloadedMapLayer))
          )
        }
      },
    [confirm, setPreloadedMapLayers, preloadedMapLayers]
  )

  const onRowDoubleClick = useCallback(({ row: preloadedMapLayer }) => {
    setEditedPreloadedMapLayer(preloadedMapLayer)
    setPreloadedLayerDialogVisible(true)
  }, [])

  return (
    <>
      <fieldset className="preloaded-map-layers-editor">
        <legend>{i18n.t('homeView:surveyInfo.preloadedMapLayers.title')}</legend>
        <div className="container">
          {!readOnly && <ButtonAdd onClick={onAddClick} size="small" />}
          <DataGrid
            columns={[
              {
                field: 'edit',
                width: 60,
                headerName: '',
                renderCell: ({ row }) => <ButtonIconEdit onClick={() => onRowDoubleClick({ row })} />,
                sortable: false,
              },
              {
                field: 'fileName',
                flex: 0.4,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileName'),
                renderCell: ({ row }) => <LabelWithTooltip label={SurveyFile.getName(row)} />,
                sortable: false,
              },
              {
                field: 'download',
                width: 60,
                headerName: '',
                renderCell: ({ row: preloadedMapLayer }) => (
                  <ButtonDownload
                    href={API.getSurveyFileDownloadUrl({ surveyId, fileUuid: SurveyFile.getUuid(preloadedMapLayer) })}
                    showLabel={false}
                    variant="text"
                  />
                ),
                sortable: false,
              },
              {
                field: 'label',
                flex: 0.5,
                headerName: i18n.t('common.label'),
                renderCell: ({ row }) => <LabelWithTooltip label={SurveyFile.getLabel(lang)(row)} />,
                sortable: false,
              },
              {
                field: 'fileSize',
                width: 120,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileSize'),
                renderCell: ({ row }) => FileUtils.toHumanReadableFileSize(SurveyFile.getSize(row)),
                sortable: false,
              },
              {
                field: 'dateCreated',
                width: 180,
                headerName: i18n.t('common.dateCreated'),
                renderCell: ({ row }) => DateUtils.formatDateTimeDisplay(SurveyFile.getDateCreated(row)),
              },
              {
                field: 'delete',
                width: 60,
                headerName: '',
                renderCell: ({ row: preloadedMapLayer }) =>
                  !readOnly && <ButtonIconDelete onClick={onDeleteClick({ preloadedMapLayer })} />,
                sortable: false,
              },
            ]}
            density="compact"
            getRowId={(row) => SurveyFile.getUuid(row)}
            hideFooterPagination
            onRowDoubleClick={onRowDoubleClick}
            rows={preloadedMapLayers}
          />
        </div>
      </fieldset>

      {preloadedLayerDialogVisible && (
        <PreloadedMapLayerEditor
          editedPreloadedMapLayer={editedPreloadedMapLayer}
          onClose={onPreloadedLayerDialogClose}
          onOk={onPreloadedLayerDialogOk}
          preloadedMapLayers={preloadedMapLayers}
        />
      )}
    </>
  )
}

PreloadedMapLayersEditor.propTypes = {
  preloadedMapLayers: PropTypes.array,
  setPreloadedMapLayers: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
}

export default PreloadedMapLayersEditor
