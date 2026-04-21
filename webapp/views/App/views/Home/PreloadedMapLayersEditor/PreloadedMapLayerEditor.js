import React, { useCallback, useState } from 'react'

import * as SurveyFile from '@core/survey/surveyFile'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { contentTypes } from '@webapp/service/api'

const accept = { [contentTypes.geojson]: ['.geojson'], [contentTypes.kmz]: ['.kmz'] }
const maxSize = 10 // 10MB

const PreloadedMapLayerEditor = (props) => {
  const { editedPreloadedMapLayer, onClose, onOk: onOkProp } = props

  const [state, setState] = useState({
    file: null,
    labels: editedPreloadedMapLayer ? SurveyFile.getLabels(editedPreloadedMapLayer) : {},
  })

  const { file, labels } = state

  const onLabelsChange = useCallback((newLabels) => setState((statePrev) => ({ ...statePrev, labels: newLabels })), [])

  const onFilesDrop = useCallback((files) => {
    setState((statePrev) => ({ ...statePrev, file: files[0] }))
  }, [])

  const onOkClick = useCallback(async () => {
    let surveyFile = null
    if (editedPreloadedMapLayer) {
      surveyFile = SurveyFile.assocLabels(labels)(editedPreloadedMapLayer)
    } else {
      const { name, size } = file
      surveyFile = SurveyFile.createFile({ name, size, labels })
    }
    await onOkProp({ file, surveyFile })
  }, [editedPreloadedMapLayer, file, labels, onOkProp])

  return (
    <Modal
      className="file-upload-dialog"
      title="homeView:surveyInfo.preloadedMapLayerEditor.title"
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <LabelsEditor labels={labels} onChange={onLabelsChange} />

        {!editedPreloadedMapLayer && (
          <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn-primary modal-footer__item"
          disabled={!editedPreloadedMapLayer && !file}
          onClick={onOkClick}
          label="common.ok"
        />
      </ModalFooter>
    </Modal>
  )
}

export default PreloadedMapLayerEditor
