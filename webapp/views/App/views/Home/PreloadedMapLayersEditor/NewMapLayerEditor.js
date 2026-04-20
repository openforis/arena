import React, { useCallback, useState } from 'react'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { contentTypes } from '@webapp/service/api'

const accept = { [contentTypes.geojson]: ['.geojson'], [contentTypes.kmz]: ['.kmz'] }
const maxSize = 10 // 10MB

const NewMapLayerEditor = (props) => {
  const { onClose, onOk } = props

  const [state, setState] = useState({})

  const { file, labels } = state

  const onLabelsChange = useCallback((newLabels) => setState((statePrev) => ({ ...statePrev, labels: newLabels })), [])

  const onFilesDrop = useCallback((files) => {
    setState((statePrev) => ({ ...statePrev, file: files[0] }))
  }, [])

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
        <Button className="btn-primary modal-footer__item" disabled={!file} onClick={onOk} label="common.ok" />
      </ModalFooter>
    </Modal>
  )
}

export default NewMapLayerEditor
