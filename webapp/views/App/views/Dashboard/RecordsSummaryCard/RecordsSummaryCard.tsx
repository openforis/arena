import React, { useCallback, useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { DashboardKpiCard } from '../components/DashboardKpiCard'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import { aggregateRecordsTotal } from '../utils/aggregateRecordsTotal'
import { useRecordsStepBreakdown } from './useRecordsStepBreakdown'

/**
 * KPI card with records added in the selected period and an all-time per-step breakdown.
 *
 * @returns {React.ReactElement} The card.
 */
const RecordsSummaryCard = () => {
  const i18n = useI18n()
  const { counts } = useRecordsSummaryContext()
  const stepRows = useRecordsStepBreakdown()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = useCallback(() => setExpanded((expandedPrev) => !expandedPrev), [])

  return (
    <DashboardKpiCard
      titleKey="homeView:dashboard.recordsCard.total"
      value={aggregateRecordsTotal(counts)}
      accent="records"
      testId={TestId.dashboard.kpiRecords}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
    >
      <p className="dashboard-records-card__subtitle">{i18n.t('homeView:dashboard.recordsCard.byStep') as string}</p>
      <ul className="dashboard-records-card__steps">
        {stepRows.map(({ key, labelKey, count }) => (
          <li key={key} className="dashboard-records-card__step">
            <span>{i18n.t(labelKey) as string}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </DashboardKpiCard>
  )
}

export default RecordsSummaryCard
