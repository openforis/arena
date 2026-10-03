import './StorageCard.scss'

import React, { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { DashboardKpiCard } from '../components/DashboardKpiCard'
import { StorageSummary } from '../StorageSummary'

type StorageStatistics = { usedSpace?: number; totalSpace?: number }

const EMPTY_VALUE_LABEL = '-'

const getUsedPercentLabel = (statistics: StorageStatistics): string => {
  const { usedSpace, totalSpace } = statistics
  if (typeof usedSpace !== 'number' || typeof totalSpace !== 'number' || totalSpace <= 0) return EMPTY_VALUE_LABEL
  return `${Math.floor((usedSpace * 100) / totalSpace)}%`
}

/**
 * KPI card with the percentage of files storage used; expanding it shows the files and database gauges.
 *
 * @returns {React.ReactElement} The card.
 */
const StorageCard = () => {
  const surveyInfo = useSurveyInfo()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = useCallback(() => setExpanded((expandedPrev) => !expandedPrev), [])

  return (
    <div className={`storage-card${expanded ? ' storage-card--expanded' : ''}`}>
      <DashboardKpiCard
        titleKey="homeView:dashboard.kpi.storage"
        value={getUsedPercentLabel(Survey.getFilesStatistics(surveyInfo))}
        accent="storage"
        testId={TestId.dashboard.kpiStorage}
        expanded={expanded}
        onToggleExpand={toggleExpanded}
      >
        <StorageSummary />
      </DashboardKpiCard>
    </div>
  )
}

export default StorageCard
