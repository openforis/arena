import './StorageSummary.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { GaugeChart } from '@webapp/charts/GaugeChart'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'

const GenericStorageSummary = ({ statistics, titleKey }) => {
  const i18n = useI18n()

  const { usedSpace, totalSpace } = statistics
  const usePercent = (usedSpace * 100) / totalSpace

  const usedLabel = FileUtils.toHumanReadableFileSize(usedSpace)
  const totalLabel = FileUtils.toHumanReadableFileSize(totalSpace)

  return (
    <div className="storage-summary-item">
      <h4 className="dashboard-chart-header">{i18n.t(titleKey)}</h4>
      <div className="dashboard-chart-subtitle">
        {i18n.t(`homeView:dashboard.storageSummary.usedSpaceOutOf`, {
          percent: Math.floor(usePercent),
          used: usedLabel,
          total: totalLabel,
        })}
      </div>
      <GaugeChart height={300} width={400} value={usePercent} />
    </div>
  )
}

GenericStorageSummary.propTypes = {
  statistics: PropTypes.any.isRequired,
  titleKey: PropTypes.string.isRequired,
}

export const StorageSummary = () => {
  const surveyInfo = useSurveyInfo()
  const filesStatistics = Survey.getFilesStatistics(surveyInfo)
  const dbStatistics = Survey.getDbStatistics(surveyInfo)

  return (
    <div className="storage-summary-container">
      <GenericStorageSummary statistics={filesStatistics} titleKey="homeView:dashboard.storageSummaryFiles.title" />
      <GenericStorageSummary statistics={dbStatistics} titleKey="homeView:dashboard.storageSummaryDb.title" />
    </div>
  )
}
