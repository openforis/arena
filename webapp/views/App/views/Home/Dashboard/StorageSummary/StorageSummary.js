import React from 'react'

import * as Survey from '@core/survey/survey'

import { GaugeChart } from '@webapp/charts/GaugeChart'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

export const StorageSummary = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)

  const { usedSpace, totalSpace } = filesStatistics
  const usePercent = (usedSpace * 100) / totalSpace

  const usedLabel = FileUtils.toHumanReadableFileSize(usedSpace)
  const totalLabel = FileUtils.toHumanReadableFileSize(totalSpace)

  return (
    <>
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.storageSummary.title')}</h4>
      <div className="dashboard-chart-subtitle">
        {i18n.t('homeView.dashboard.storageSummary.usedSpaceOutOf', {
          percent: Math.floor(usePercent),
          used: usedLabel,
          total: totalLabel,
        })}
      </div>
      <GaugeChart height={300} width={400} value={usePercent} />
    </>
  )
}
