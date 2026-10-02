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
  const hasTrendData = counts.length > 0

  return (
    <DashboardSection titleKey="homeView:dashboard.totalRecords" testId={TestId.dashboard.trendSection}>
      <Box
        sx={{
          width: '100%',
          // Recharts ResponsiveContainer needs a definite parent height only when charting.
          ...(hasTrendData
            ? { minHeight: '16rem', height: '16rem' }
            : {
                '& .no-records-added': {
                  padding: '2rem 0',
                  textAlign: 'center',
                  color: defaultTokens.colors.blueDark,
                },
              }),
        }}
      >
        <TotalRecordsSummaryChart counts={counts} />
      </Box>
    </DashboardSection>
  )
}

export default RecordTrendSection
