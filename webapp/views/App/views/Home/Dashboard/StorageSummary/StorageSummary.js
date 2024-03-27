import React from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

import GaugeChart from './GaugeChart'

const colorsByKey = {
  availableSpace: 'green',
  usedSpace: 'orange',
}

export const StorageSummary = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)

  const data = ['availableSpace', 'usedSpace', 'totalSpace'].map((key) => ({
    name: key,
    value: filesStatistics[key],
    label: i18n.t(`homeView.dashboard.storageSummary.${key}`, {
      size: FileUtils.toHumanReadableFileSize(filesStatistics[key]),
    }),
    color: colorsByKey[key],
  }))

  return <GaugeChart data={data} />
}
