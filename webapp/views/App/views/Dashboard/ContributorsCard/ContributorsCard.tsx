import React, { useCallback, useMemo, useState } from 'react'

import * as User from '@core/user/user'

import { TestId } from '@webapp/utils/testId'
import { useUser } from '@webapp/store/user'
import { useAuthCanViewAllUsers } from '@webapp/store/user/hooks'

import { DashboardKpiCard } from '../components/DashboardKpiCard'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'
import { filterVisibleContributors } from '../utils/filterVisibleContributors'
import { ContributorsDetail } from './ContributorsDetail'

/**
 * KPI card with the number of contributors who added records in the selected period.
 * Viewers without permission to see all users only see their own row.
 *
 * @returns {React.ReactElement} The card.
 */
const ContributorsCard = () => {
  const { userCounts } = useRecordsSummaryContext()
  const canViewAllUsers = useAuthCanViewAllUsers()
  const user = useUser()
  const [expanded, setExpanded] = useState(false)

  const visibleUserCounts = useMemo(
    () =>
      filterVisibleContributors({
        userCounts,
        canViewAllUsers,
        currentUserUuid: User.getUuid(user),
      }),
    [canViewAllUsers, user, userCounts]
  )

  const toggleExpanded = useCallback(() => setExpanded((expandedPrev) => !expandedPrev), [])

  return (
    <DashboardKpiCard
      titleKey="homeView:dashboard.kpi.contributors"
      value={visibleUserCounts.length}
      testId={TestId.dashboard.kpiContributors}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
    >
      <ContributorsDetail userCounts={visibleUserCounts} />
    </DashboardKpiCard>
  )
}

export default ContributorsCard
