import { useCallback, useEffect, useState } from 'react'

import type { AreaOfInterest, AreaOfInterestDescriptor } from '@openforis/arena-core'

import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import { SurveyAreaOfInterestValidator } from '@core/survey/surveyAreaOfInterestValidator'
import * as SurveyFile from '@core/survey/surveyFile'
import type { ValidationInstance } from '@core/validation/validation'
import * as Validation from '@core/validation/validation'

import { Button, Dropzone, Modal, ModalBody, ModalFooter } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useNotifyWarning } from '@webapp/components/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'
import * as API from '@webapp/service/api'
import { contentTypes } from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

const accept = {
  [contentTypes.geojson]: ['.geojson'],
  'application/json': ['.json'],
}

// geometry dropped and normalized, uploaded on OK
type Upload = { surveyFile: any; content: File; areaOfInterest: AreaOfInterest }

type Props = {
  // the other areas of interest of the survey (the edited one excluded)
  areasOfInterest: AreaOfInterestDescriptor[]
  editedAreaOfInterest: AreaOfInterestDescriptor | null
  onClose: () => void
  onOk: (areaOfInterest: AreaOfInterestDescriptor) => void
}

const createUpload = ({ fileName, areaOfInterest }: { fileName: string; areaOfInterest: AreaOfInterest }): Upload => {
  // only the geometry is stored (feature properties and other geometries are dropped)
  const content = new File([JSON.stringify(areaOfInterest)], fileName, { type: contentTypes.geojson })
  const surveyFile = SurveyFile.createFile({
    type: SurveyFile.SurveyFileType.areaOfInterest,
    temporary: true,
    name: fileName,
    size: content.size,
  })
  return { surveyFile, content, areaOfInterest }
}

const buildDraft = ({
  editedAreaOfInterest,
  name,
  labels,
  upload,
}: {
  editedAreaOfInterest: AreaOfInterestDescriptor | null
  name: string
  labels: Record<string, string>
  upload: Upload | null
}): Partial<AreaOfInterestDescriptor> => {
  if (upload) {
    const { surveyFile, content, areaOfInterest } = upload
    return SurveyAreaOfInterest.newAreaOfInterestDescriptor({
      name,
      labels,
      fileUuid: SurveyFile.getUuid(surveyFile),
      fileName: SurveyFile.getName(surveyFile),
      size: content.size,
      areaOfInterest,
    })
  }
  return { ...editedAreaOfInterest, name, labels }
}

export const AreaOfInterestDialog = (props: Props) => {
  const { areasOfInterest, editedAreaOfInterest, onClose, onOk } = props

  const surveyId = useSurveyId()
  const notifyWarning = useNotifyWarning()

  const [name, setName] = useState(editedAreaOfInterest?.name ?? '')
  const [labels, setLabels] = useState<Record<string, string>>(editedAreaOfInterest?.labels ?? {})
  const [upload, setUpload] = useState<Upload | null>(null)
  const [validation, setValidation] = useState<ValidationInstance | null>(null)
  const [uploading, setUploading] = useState(false)

  const draft = buildDraft({ editedAreaOfInterest, name, labels, upload })

  useEffect(() => {
    void SurveyAreaOfInterestValidator.validate({ areasOfInterest, areaOfInterest: draft }).then(setValidation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasOfInterest, name, labels, upload])

  const onFilesDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const areaOfInterest = parseAreaOfInterestJson(await file.text())
      if (areaOfInterest) {
        setUpload(createUpload({ fileName: file.name, areaOfInterest }))
      } else {
        notifyWarning({ key: 'homeView:surveyInfo.areasOfInterest.invalidFile' })
      }
    },
    [notifyWarning]
  )

  const onOkClick = useCallback(async () => {
    if (upload) {
      setUploading(true)
      try {
        await API.insertSurveyFile({ surveyId, file: upload.content, surveyFile: upload.surveyFile })
      } finally {
        setUploading(false)
      }
    }
    onOk(draft as AreaOfInterestDescriptor)
  }, [draft, onOk, surveyId, upload])

  return (
    <Modal
      className="file-upload-dialog"
      title="homeView:surveyInfo.areasOfInterest.editor.title"
      onClose={onClose}
      showCloseButton
    >
      <ModalBody>
        <FormItem label="homeView:surveyInfo.areasOfInterest.name">
          <Input
            onChange={setName}
            value={name}
            validation={Validation.getFieldValidation(SurveyAreaOfInterest.keys.name)(validation)}
          />
        </FormItem>
        <LabelsEditor labels={labels} onChange={setLabels} />
        <ValidationTooltip validation={Validation.getFieldValidation(SurveyAreaOfInterest.keys.fileUuid)(validation)}>
          <Dropzone
            accept={accept}
            disabled={uploading}
            droppedFiles={upload ? [upload.content] : []}
            maxSize={SurveyAreaOfInterest.AREA_OF_INTEREST_MAX_FILE_SIZE_MB}
            onDrop={onFilesDrop}
          />
        </ValidationTooltip>
      </ModalBody>
      <ModalFooter>
        <Button
          className="btn-primary modal-footer__item"
          disabled={!Validation.isValid(validation) || uploading}
          onClick={onOkClick}
          label="common.ok"
        />
      </ModalFooter>
    </Modal>
  )
}
