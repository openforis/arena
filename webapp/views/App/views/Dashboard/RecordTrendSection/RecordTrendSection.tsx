import React from 'react'
import Box from '@mui/material/Box'

import { TestId } from '@webapp/utils/testId'
import { defaultTokens } from '@webapp/theme/tokens'

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
      <Box
        sx={{
          '& .no-records-added': {
            padding: '2rem 0',
            textAlign: 'center',
            color: defaultTokens.colors.blueDark,
          },
        }}
      >
        <TotalRecordsSummaryChart counts={counts} />
      </Box>
    </DashboardSection>
  )
}

export default RecordTrendSection
