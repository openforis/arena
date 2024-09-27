import React from 'react'

import { NumberConversionUtils } from '@core/numberConversionUtils'
import * as Survey from '@core/survey/survey'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

const { dataStorageUnits, dataStorageValueToBytes, dataStorageBytesToUnit } = NumberConversionUtils

const defaultTotalSpaceGB = 10
const defaultTotalSpace = dataStorageValueToBytes(dataStorageUnits.GB)(defaultTotalSpaceGB)

export const SurveyConfigurationEditor = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)

  const { usedSpace, totalSpace } = filesStatistics
  const minTotalSpace = Math.max(usedSpace, defaultTotalSpace)
  const totalSpaceGB = dataStorageBytesToUnit(dataStorageUnits.GB)(totalSpace)

  return (
    <div>
      <FormItem label={i18n.t('homeView.surveyInfo.configuration.filesTotalSpace')}>
        <Input numberFormat={NumberFormats.integer()} onChange={(val) => val} value={totalSpaceGB} />

        
      </FormItem>
    </div>
  )
}
