import './SurveyDocImageEditor.scss'

import { useCallback, useEffect, useState } from 'react'

import {
  DocumentPlace,
  assocDocumentPlace,
  assocExpression,
  createSurveyDocImage,
  propKeys as docImagePropKeys,
  getDocumentPlace,
  getExpression,
  type SurveyDocImage,
} from '@core/survey/surveyDocImage'
import { SurveyDocImageValidator } from '@core/survey/surveyDocImageValidator'
import * as SurveyFile from '@core/survey/surveyFile'
import type { ValidationInstance } from '@core/validation/validation'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDownload, Dropzone, Modal, ModalBody, ModalFooter, RadioButtonGroup } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'
import * as API from '@webapp/service/api'
import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const accept = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/svg+xml': ['.svg'],
}
const maxSize = 5 // 5MB

type Props = {
  editedSurveyDocImage: SurveyDocImage | null
  onClose: () => void
  onOk: (params: { file: File | null; surveyDocImage: SurveyDocImage }) => Promise<void>
  surveyDocImages: SurveyDocImage[]
}

type State = {
  draftSurveyDocImage: SurveyDocImage
  file: File | null
  labels: Record<string, string>
  documentPlace: DocumentPlace | undefined
  expression: string
  validation: ValidationInstance | null
}

const SurveyDocImageEditor = (props: Props) => {
  const { editedSurveyDocImage, onClose, onOk: onOkProp, surveyDocImages } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  const [state, setState] = useState<State>({
    draftSurveyDocImage: editedSurveyDocImage ?? createSurveyDocImage({}),
    file: null,
    labels: editedSurveyDocImage ? SurveyFile.getLabels(editedSurveyDocImage) : {},
    documentPlace: editedSurveyDocImage ? getDocumentPlace(editedSurveyDocImage) : undefined,
    expression: editedSurveyDocImage ? getExpression(editedSurveyDocImage) : '',
    validation: null,
  })

  const { draftSurveyDocImage, file, labels, documentPlace, expression, validation } = state

  const onLabelsChange = useCallback(
    (newLabels: Record<string, string>) => setState((prev) => ({ ...prev, labels: newLabels })),
    []
  )

  const onFilesDrop = useCallback((files: File[]) => {
    setState((prev) => ({ ...prev, file: files[0] }))
  }, [])

  const onDocumentPlaceChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, documentPlace: value as DocumentPlace }))
  }, [])

  const onExpressionChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, expression: value }))
  }, [])

  useEffect(() => {
    const { name, size } = file ?? {}
    let draft: SurveyDocImage
    if (editedSurveyDocImage && file) {
      // New file uploaded during edit: fresh UUID so the old file becomes an orphan and is cleaned up on save
      draft = createSurveyDocImage({ labels, name, size, temporary: true })
    } else if (editedSurveyDocImage) {
      draft = SurveyFile.assocLabels(labels)(editedSurveyDocImage)
    } else {
      draft = createSurveyDocImage({ labels, name, size, temporary: true })
    }
    if (documentPlace) draft = assocDocumentPlace(documentPlace)(draft)
    draft = assocExpression(expression)(draft)

    SurveyDocImageValidator.validate({ survey, surveyDocImages, surveyDocImage: draft }).then((v) => {
      setState((prev) => ({ ...prev, draftSurveyDocImage: draft, validation: v }))
    })
  }, [editedSurveyDocImage, file, labels, documentPlace, expression, survey, surveyDocImages])

  const onOkClick = useCallback(async () => {
    await onOkProp({ file, surveyDocImage: draftSurveyDocImage })
  }, [file, draftSurveyDocImage, onOkProp])

  const documentPlaceItems = Object.values(DocumentPlace).map((value) => ({
    key: value,
    label: i18n.t(`homeView:surveyInfo.surveyDocLayout.documentPlaceValues.${value}`),
  }))

  const okButtonDisabled = !Validation.isValid(validation) || (!editedSurveyDocImage && !file)

  return (
    <Modal
      className="file-upload-dialog"
      title="homeView:surveyInfo.surveyDocLayout.editor.title"
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <div className="survey-doc-image-editor">
          <LabelsEditor
            labels={labels}
            onChange={onLabelsChange}
            validation={Validation.getFieldValidation(SurveyFile.propKeys.labels)(validation)}
          />
          <FormItem label="homeView:surveyInfo.surveyDocLayout.documentPlace">
            <ValidationTooltip validation={Validation.getFieldValidation(docImagePropKeys.documentPlace)(validation)}>
              <RadioButtonGroup items={documentPlaceItems} onChange={onDocumentPlaceChange} row value={documentPlace} />
            </ValidationTooltip>
          </FormItem>
          <FormItem label="homeView:surveyInfo.surveyDocLayout.expression">
            <Input
              onChange={onExpressionChange}
              value={expression}
              validation={Validation.getFieldValidation(docImagePropKeys.expression)(validation)}
            />
          </FormItem>
          {editedSurveyDocImage && !file && (
            <FormItem label="common:files.fileName">
              <div className="survey-doc-image-editor__current-file">
                <span>{SurveyFile.getName(editedSurveyDocImage)}</span>
                <ButtonDownload
                  href={API.getSurveyFileDownloadUrl({
                    surveyId,
                    fileUuid: SurveyFile.getUuid(editedSurveyDocImage),
                  })}
                  showLabel={false}
                  variant="text"
                />
              </div>
            </FormItem>
          )}
          <ValidationTooltip validation={Validation.getFieldValidation(SurveyFile.propKeys.name)(validation)}>
            <Dropzone accept={accept} maxSize={maxSize} onDrop={onFilesDrop} droppedFiles={file ? [file] : []} />
          </ValidationTooltip>
        </div>
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

export default SurveyDocImageEditor
