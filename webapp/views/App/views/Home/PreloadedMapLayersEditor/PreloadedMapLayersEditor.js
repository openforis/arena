import React, { useCallback, useState } from 'react'

import * as SurveyFile from '@core/survey/surveyFile'

import { ButtonAdd, ButtonIconDelete } from '@webapp/components'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

import PreloadedMapLayerEditor from './PreloadedMapLayerEditor'

const PreloadedMapLayersEditor = (props) => {
  const { preloadedMapLayers, setPreloadedMapLayers, readOnly } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

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
    ({ file, surveyFile }) => {
      setPreloadedLayerDialogVisible(false)
      setEditedPreloadedMapLayer(null)

      const preloadedMapLayersNext = editedPreloadedMapLayer
        ? preloadedMapLayers.map((l) =>
            SurveyFile.getUuid(l) === SurveyFile.getUuid(editedPreloadedMapLayer) ? surveyFile : l
          )
        : [...(preloadedMapLayers ?? []), surveyFile]
      setPreloadedMapLayers(preloadedMapLayersNext)
    },
    [editedPreloadedMapLayer, preloadedMapLayers, setPreloadedMapLayers]
  )

  const onDeleteClick = useCallback(
    ({ preloadedMapLayer }) =>
      () => {
        setPreloadedMapLayers(
          preloadedMapLayers.filter((l) => SurveyFile.getUuid(l) !== SurveyFile.getUuid(preloadedMapLayer))
        )
      },
    [setPreloadedMapLayers, preloadedMapLayers]
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
                field: 'fileName',
                flex: 0.4,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileName'),
                renderCell: ({ row }) => <LabelWithTooltip label={SurveyFile.getName(row)} />,
              },
              {
                field: 'label',
                flex: 0.6,
                headerName: i18n.t('common.label'),
                renderCell: ({ row }) => <LabelWithTooltip label={SurveyFile.getLabel(lang)(row)} />,
              },
              {
                field: 'fileSize',
                flex: 0.2,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileSize'),
                renderCell: ({ row }) => FileUtils.toHumanReadableFileSize(SurveyFile.getSize(row)),
              },
              {
                field: 'delete',
                width: 50,
                headerName: '',
                renderCell: ({ row: preloadedMapLayer }) =>
                  !readOnly && <ButtonIconDelete onClick={onDeleteClick({ preloadedMapLayer })} />,
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
        />
      )}
    </>
  )
}

export default PreloadedMapLayersEditor
