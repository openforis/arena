import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import { SurveyPreloadedMapLayerValidator } from '@core/survey/surveyPreloadedMapLayerValidator'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'
import ValidationTooltip from '@webapp/components/validationTooltip'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { contentTypes } from '@webapp/service/api'

const accept = { [contentTypes.geojson]: ['.geojson'], [contentTypes.kmz]: ['.kmz'] }
const maxSize = 10 // 10MB

const PreloadedMapLayerEditor = (props) => {
  const { editedPreloadedMapLayer, onClose, onOk: onOkProp, preloadedMapLayers } = props

  const [state, setState] = useState({
    draftPreloadedMapLayer: editedPreloadedMapLayer,
    file: null,
    labels: editedPreloadedMapLayer ? SurveyFile.getLabels(editedPreloadedMapLayer) : {},
    validation: null,
  })

  const { draftPreloadedMapLayer, file, labels, validation } = state

  const onLabelsChange = useCallback((newLabels) => setState((statePrev) => ({ ...statePrev, labels: newLabels })), [])

  const onFilesDrop = useCallback((files) => {
    setState((statePrev) => ({ ...statePrev, file: files[0] }))
  }, [])

  useEffect(() => {
    let draftPreloadedMapLayer
    if (editedPreloadedMapLayer) {
      draftPreloadedMapLayer = SurveyFile.assocLabels(labels)(editedPreloadedMapLayer)
    } else {
      const { name, size } = file ?? {}
      draftPreloadedMapLayer = SurveyFile.createFile({
        labels,
        name,
        size,
        type: SurveyFile.SurveyFileType.preloadedMapLayer,
        temporary: true,
      })
    }
    SurveyPreloadedMapLayerValidator.validate({ preloadedMapLayers, preloadedMapLayer: draftPreloadedMapLayer }).then(
      (validation) => {
        setState((statePrev) => ({
          ...statePrev,
          draftPreloadedMapLayer,
          validation,
        }))
      }
    )
  }, [editedPreloadedMapLayer, file, labels, preloadedMapLayers])

  const onOkClick = useCallback(async () => {
    await onOkProp({ file, surveyFile: draftPreloadedMapLayer })
  }, [file, draftPreloadedMapLayer, onOkProp])

  const okButtonDisabled = !Validation.isValid(validation) || (!editedPreloadedMapLayer && !file)

  return (
    <Modal
      className="file-upload-dialog"
      title="homeView:surveyInfo.preloadedMapLayers.editor.title"
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <LabelsEditor
          labels={labels}
          onChange={onLabelsChange}
          validation={Validation.getFieldValidation(SurveyFile.propKeys.labels)(validation)}
        />
        {!editedPreloadedMapLayer && (
          <ValidationTooltip validation={Validation.getFieldValidation(SurveyFile.propKeys.name)(validation)}>
            <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} />
          </ValidationTooltip>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn-primary modal-footer__item"
          disabled={okButtonDisabled}
          onClick={onOkClick}
          label="common.ok"
        />
      </ModalFooter>
    </Modal>
  )
}

PreloadedMapLayerEditor.propTypes = {
  editedPreloadedMapLayer: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  preloadedMapLayers: PropTypes.array.isRequired,
}

export default PreloadedMapLayerEditor
