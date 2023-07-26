import React from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'
import { FileUtils } from '@webapp/utils/fileUtils'

import { PieChart } from './PieChart'
import { useI18n } from '@webapp/store/system'

const colorsByKey = {
  availableSpace: 'green',
  usedSpace: 'orange',
}

export const StorageSummary = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)

  const data = ['availableSpace', 'usedSpace'].map((key) => ({
    name: key,
    value: filesStatistics[key],
    label: i18n.t(`homeView.dashboard.storageSummary.${key}`, {
      size: FileUtils.toHumanReadableFileSize(filesStatistics[key]),
    }),
    color: colorsByKey[key],
  }))

  return <PieChart data={data} width={400} height={400} />
}
