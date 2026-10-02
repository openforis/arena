import React from 'react'
import Box from '@mui/material/Box'

import { useI18n } from '@webapp/store/system'

import { dashboardSurfaces } from '../theme/dashboardSurfaces'

type DashboardSectionProps = {
  titleKey?: string
  testId?: string
  children: React.ReactNode
}

/**
 * Titled container grouping related dashboard content.
 *
 * @param {DashboardSectionProps} props - The component props.
 * @returns {React.ReactElement} The section.
 */
export const DashboardSection = (props: DashboardSectionProps) => {
  const { titleKey, testId, children } = props
  const i18n = useI18n()

  return (
    <Box component="section" data-testid={testId} sx={dashboardSurfaces.section}>
      {titleKey && (
        <Box component="h3" sx={dashboardSurfaces.sectionTitle}>
          {i18n.t(titleKey) as string}
        </Box>
      )}
      {children}
    </Box>
  )
}
