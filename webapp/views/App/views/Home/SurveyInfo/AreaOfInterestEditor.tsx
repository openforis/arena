import { useCallback } from 'react'

import type { AreaOfInterest } from '@openforis/arena-core'

import { getAreaOfInterestSummary, parseAreaOfInterest } from '@core/geo/areaOfInterestParser'

import { Button, ButtonIconDelete, Dropzone } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { useConfirmAsync, useNotifyWarning } from '@webapp/components/hooks'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { contentTypes } from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import * as DomUtils from '@webapp/utils/domUtils'

const accept = {
  [contentTypes.geojson]: ['.geojson'],
  'application/json': ['.json'],
}
// the area of interest is stored in the survey props, loaded everywhere with the survey: keep it small
const maxSizeMB = 1

const readAreaOfInterest = async (file: File): Promise<AreaOfInterest | null> => {
  try {
    return parseAreaOfInterest(JSON.parse(await file.text()))
  } catch {
    // not a valid JSON file
    return null
  }
}

type Props = {
  areaOfInterest: AreaOfInterest | null
  readOnly: boolean
  setAreaOfInterest: (areaOfInterest: AreaOfInterest | null) => void
  validation?: object
}

export const AreaOfInterestEditor = (props: Props) => {
  const { areaOfInterest, readOnly, setAreaOfInterest, validation } = props

  const notifyWarning = useNotifyWarning()
  const i18n = useI18n()
  const confirm = useConfirmAsync()

  const onFilesDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const areaOfInterestNext = await readAreaOfInterest(file)
      if (areaOfInterestNext) {
        setAreaOfInterest(areaOfInterestNext)
      } else {
        notifyWarning({ key: 'homeView:surveyInfo.areaOfInterest.invalidFile' })
      }
    },
    [notifyWarning, setAreaOfInterest]
  )

  const onDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(areaOfInterest)], { type: contentTypes.geojson })
    DomUtils.downloadBlobToFile(blob, 'area_of_interest.geojson')
  }, [areaOfInterest])

  const onDelete = useCallback(async () => {
    if (await confirm({ key: 'homeView:surveyInfo.areaOfInterest.confirmDelete' })) {
      setAreaOfInterest(null)
    }
  }, [confirm, setAreaOfInterest])

  return (
    <FormItem className="survey-info__area-of-interest" label="homeView:surveyInfo.areaOfInterest.title">
      <ValidationTooltip validation={validation}>
        <p>{i18n.t('homeView:surveyInfo.areaOfInterest.info')}</p>
        {areaOfInterest ? (
          <div className="survey-info__area-of-interest-summary">
            <span>
              {i18n.t('homeView:surveyInfo.areaOfInterest.summary', getAreaOfInterestSummary(areaOfInterest))}
            </span>
            <Button iconClassName="icon-download2 icon-14px" label="common.download" onClick={onDownload} />
            {!readOnly && <ButtonIconDelete onClick={onDelete} />}
          </div>
        ) : (
          !readOnly && <Dropzone accept={accept} maxSize={maxSizeMB} onDrop={onFilesDrop} />
        )}
      </ValidationTooltip>
    </FormItem>
  )
}
