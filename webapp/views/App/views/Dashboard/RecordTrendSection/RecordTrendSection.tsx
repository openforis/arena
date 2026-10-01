import './RecordTrendSection.scss'

import React from 'react'

import { TestId } from '@webapp/utils/testId'

import { DashboardSection } from '../components/DashboardSection'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import TotalRecordsSummaryChart from '../TotalRecordsSummaryChart'

/**
 * Section with the trend of records added over the selected period.
 *
 * @returns {React.ReactElement} The section.
 */
const RecordTrendSection = () => {
  const { counts } = useRecordsSummaryContext()

  return (
    <DashboardSection titleKey="homeView:dashboard.totalRecords" testId={TestId.dashboard.trendSection}>
      <div className="record-trend-section__chart">
        <TotalRecordsSummaryChart counts={counts} />
      </div>
    </DashboardSection>
  )
}

export default RecordTrendSection
