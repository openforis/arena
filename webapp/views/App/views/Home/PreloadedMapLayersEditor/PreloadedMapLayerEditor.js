import React, { useCallback, useState } from 'react'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { contentTypes } from '@webapp/service/api'
import { SurveyPreloadedMapLayer } from '@core/survey/surveyPreloadedMapLayer'

const accept = { [contentTypes.geojson]: ['.geojson'], [contentTypes.kmz]: ['.kmz'] }
const maxSize = 10 // 10MB

const PreloadedMapLayerEditor = (props) => {
  const { onClose, onOk: onOkProp } = props

  const [state, setState] = useState({})

  const { file, labels } = state

  const onLabelsChange = useCallback((newLabels) => setState((statePrev) => ({ ...statePrev, labels: newLabels })), [])

  const onFilesDrop = useCallback((files) => {
    setState((statePrev) => ({ ...statePrev, file: files[0] }))
  }, [])

  const onOkClick = useCallback(() => {
    onOkProp({
      file,
      preloadedMapLayer: SurveyPreloadedMapLayer.newInstance({ fileName: file.name, fileSize: file.size, labels }),
    })
  }, [file, labels, onOkProp])

  return (
    <Modal
      className="file-upload-dialog"
      title="homeView:surveyInfo.preloadedMapLayerEditor.title"
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <LabelsEditor labels={labels} onChange={onLabelsChange} />

        <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} />
      </ModalBody>
      <ModalFooter>
        <Button className="btn-primary modal-footer__item" disabled={!file} onClick={onOkClick} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}

export default PreloadedMapLayerEditor
