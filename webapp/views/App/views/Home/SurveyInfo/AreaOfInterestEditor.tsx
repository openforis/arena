import { useCallback, useState } from 'react'

import type { AreaOfInterest } from '@openforis/arena-core'

import { parseAreaOfInterestJson } from '@core/geo/areaOfInterestParser'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import type { AreaOfInterestFileDescriptor } from '@core/survey/surveyAreaOfInterest'
import * as SurveyFile from '@core/survey/surveyFile'

import { ButtonDownload, ButtonIconDelete, Dropzone } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { useConfirmAsync, useNotifyWarning } from '@webapp/components/hooks'
import ValidationTooltip from '@webapp/components/validationTooltip'
import * as API from '@webapp/service/api'
import { contentTypes } from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const accept = {
  [contentTypes.geojson]: ['.geojson'],
  'application/json': ['.json'],
}

type Props = {
  areaOfInterestFile: AreaOfInterestFileDescriptor | null
  readOnly: boolean
  setAreaOfInterestFile: (areaOfInterestFile: AreaOfInterestFileDescriptor | null) => void
  validation?: object
}

export const AreaOfInterestEditor = (props: Props) => {
  const { areaOfInterestFile, readOnly, setAreaOfInterestFile, validation } = props

  const notifyWarning = useNotifyWarning()
  const i18n = useI18n()
  const confirm = useConfirmAsync()
  const surveyId = useSurveyId()
  const [uploading, setUploading] = useState(false)

  const uploadAreaOfInterest = useCallback(
    async ({ name, areaOfInterest }: { name: string; areaOfInterest: AreaOfInterest }) => {
      // only the geometry is stored (feature properties and other geometries are dropped)
      const content = new File([JSON.stringify(areaOfInterest)], name, { type: contentTypes.geojson })
      const surveyFile = SurveyFile.createFile({
        type: SurveyFile.SurveyFileType.areaOfInterest,
        temporary: true,
        name,
        size: content.size,
      })
      setUploading(true)
      try {
        await API.insertSurveyFile({ surveyId, file: content, surveyFile })
        setAreaOfInterestFile(
          SurveyAreaOfInterest.newAreaOfInterestFileDescriptor({
            fileUuid: SurveyFile.getUuid(surveyFile),
            name,
            size: content.size,
            areaOfInterest,
          })
        )
      } finally {
        setUploading(false)
      }
    },
    [setAreaOfInterestFile, surveyId]
  )

  const onFilesDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const areaOfInterest = parseAreaOfInterestJson(await file.text())
      if (areaOfInterest) {
        await uploadAreaOfInterest({ name: file.name, areaOfInterest })
      } else {
        notifyWarning({ key: 'homeView:surveyInfo.areaOfInterest.invalidFile' })
      }
    },
    [notifyWarning, uploadAreaOfInterest]
  )

  const onDelete = useCallback(async () => {
    if (await confirm({ key: 'homeView:surveyInfo.areaOfInterest.confirmDelete' })) {
      setAreaOfInterestFile(null)
    }
  }, [confirm, setAreaOfInterestFile])

  const renderContent = () => {
    if (areaOfInterestFile) {
      const { fileUuid, polygons, vertices } = areaOfInterestFile
      return (
        <div className="survey-info__area-of-interest-summary">
          <span>{i18n.t('homeView:surveyInfo.areaOfInterest.summary', { polygons, vertices })}</span>
          <ButtonDownload href={API.getSurveyFileDownloadUrl({ surveyId, fileUuid })} />
          {!readOnly && <ButtonIconDelete onClick={onDelete} />}
        </div>
      )
    }
    if (readOnly) return null
    return (
      <Dropzone
        accept={accept}
        disabled={uploading}
        maxSize={SurveyAreaOfInterest.AREA_OF_INTEREST_MAX_FILE_SIZE_MB}
        onDrop={onFilesDrop}
      />
    )
  }

  return (
    <FormItem className="survey-info__area-of-interest" label="homeView:surveyInfo.areaOfInterest.title">
      <ValidationTooltip validation={validation}>
        <p>{i18n.t('homeView:surveyInfo.areaOfInterest.info')}</p>
        {renderContent()}
      </ValidationTooltip>
    </FormItem>
  )
}
