import React, { useCallback, useState } from 'react'

import { ButtonAdd } from '@webapp/components'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

import NewMapLayerEditor from './NewMapLayerEditor'

const PreloadedMapLayersEditor = (props) => {
  const { preloadedMapLayers } = props

  const i18n = useI18n()

  const [newLayerDialogVisible, setNewLayerDialogVisible] = useState(false)

  const onAddClick = useCallback(() => {
    setNewLayerDialogVisible(true)
  }, [])

  const onNewLayerDialogClose = useCallback(() => {
    setNewLayerDialogVisible(false)
  }, [])

  const onNewLayerDialogOk = useCallback(() => {
    setNewLayerDialogVisible(false)
  }, [])

  return (
    <>
      <fieldset className="preloaded-map-layers-editor">
        <legend>{i18n.t('homeView:surveyInfo.preloadedMapLayers.title')}</legend>
        <div className="container">
          <ButtonAdd onClick={onAddClick} size="small" />
          <DataGrid
            columns={[
              {
                field: 'fileName',
                flex: 0.4,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileName'),
                renderCell: ({ value }) => <LabelWithTooltip label={value} />,
              },
              {
                field: 'label',
                flex: 0.6,
                headerName: i18n.t('common.label'),
                renderCell: (rowProps) => {
                  console.log('===rowProps', rowProps)
                },
              },
              {
                field: 'fileSize',
                flex: 0.2,
                headerName: i18n.t('homeView:surveyInfo.preloadedMapLayers.fileSize'),
                valueFormatter: (value) => FileUtils.toHumanReadableFileSize(value),
              },
            ]}
            density="compact"
            rows={preloadedMapLayers}
            getRowId={(row) => row.fileName}
          />
        </div>
      </fieldset>

      {newLayerDialogVisible && <NewMapLayerEditor onClose={onNewLayerDialogClose} onOk={onNewLayerDialogOk} />}
    </>
  )
}

export default PreloadedMapLayersEditor
