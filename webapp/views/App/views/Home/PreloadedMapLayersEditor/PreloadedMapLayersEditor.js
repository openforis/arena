import React, { useCallback, useState } from 'react'

import * as SurveyFile from '@core/survey/surveyFile'

import { ButtonAdd } from '@webapp/components'
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

  const [newLayerDialogVisible, setNewLayerDialogVisible] = useState(false)

  const onAddClick = useCallback(() => {
    setNewLayerDialogVisible(true)
  }, [])

  const onNewLayerDialogClose = useCallback(() => {
    setNewLayerDialogVisible(false)
  }, [])

  const onNewLayerDialogOk = useCallback(
    ({ file, surveyFile }) => {
      setNewLayerDialogVisible(false)

      setPreloadedMapLayers([...(preloadedMapLayers ?? []), surveyFile])
    },
    [setPreloadedMapLayers, preloadedMapLayers]
  )

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
            ]}
            density="compact"
            getRowId={(row) => SurveyFile.getUuid(row)}
            hideFooterPagination
            rows={preloadedMapLayers}
          />
        </div>
      </fieldset>

      {newLayerDialogVisible && <PreloadedMapLayerEditor onClose={onNewLayerDialogClose} onOk={onNewLayerDialogOk} />}
    </>
  )
}

export default PreloadedMapLayersEditor
