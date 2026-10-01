import React, { useCallback, useState } from 'react'

import { TestId } from '@webapp/utils/testId'

import { DashboardKpiCard } from '../components/DashboardKpiCard'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import { ContributorsDetail } from './ContributorsDetail'

/**
 * KPI card with the number of contributors who added records in the selected period.
 *
 * @returns {React.ReactElement} The card.
 */
const ContributorsCard = () => {
  const { userCounts } = useRecordsSummaryContext()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = useCallback(() => setExpanded((expandedPrev) => !expandedPrev), [])

  return (
    <DashboardKpiCard
      titleKey="homeView:dashboard.kpi.contributors"
      value={userCounts.length}
      testId={TestId.dashboard.kpiContributors}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
    >
      <ContributorsDetail userCounts={userCounts} />
    </DashboardKpiCard>
  )
}

export default ContributorsCard
