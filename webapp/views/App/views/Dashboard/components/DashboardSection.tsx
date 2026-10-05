import React, { useId } from 'react'
import Box from '@mui/material/Box'

import { useI18n } from '@webapp/store/system'

import { dashboardSurfaces } from '../theme/dashboardSurfaces'

type DashboardSectionProps = {
  titleKey?: string
  testId?: string
  // when defined the title becomes a toggle and the section is collapsible
  expanded?: boolean
  onToggle?: () => void
  toggleTestId?: string
  children?: React.ReactNode
}

type SectionToggleProps = {
  title: string
  expanded: boolean
  contentId: string
  testId?: string
  onToggle: () => void
}

const SectionToggle = (props: SectionToggleProps) => {
  const { title, expanded, contentId, testId, onToggle } = props
  const iconSx = expanded
    ? dashboardSurfaces.sectionToggleIcon
    : { ...dashboardSurfaces.sectionToggleIcon, ...dashboardSurfaces.sectionToggleIconCollapsed }

  return (
    <Box
      component="button"
      type="button"
      aria-expanded={expanded}
      aria-controls={contentId}
      data-testid={testId}
      onClick={onToggle}
      sx={dashboardSurfaces.sectionToggle}
    >
      {title}
      <Box component="span" className="icon icon-ctrl icon-16px" aria-hidden="true" sx={iconSx} />
    </Box>
  )
}

/**
 * Titled container grouping related dashboard content; collapsible when `onToggle` is given.
 *
 * @param {DashboardSectionProps} props - The component props.
 * @returns {React.ReactElement} The section.
 */
export const DashboardSection = (props: DashboardSectionProps) => {
  const { titleKey, testId, expanded = true, onToggle, toggleTestId, children } = props
  const i18n = useI18n()
  const contentId = useId()
  const title = titleKey ? (i18n.t(titleKey) as string) : undefined

  if (!onToggle) {
    return (
      <Box component="section" data-testid={testId} sx={dashboardSurfaces.section}>
        {title && (
          <Box component="h3" sx={dashboardSurfaces.sectionTitle}>
            {title}
          </Box>
        )}
        {children}
      </Box>
    )
  }

  return (
    <Box component="section" data-testid={testId} sx={dashboardSurfaces.section}>
      <Box component="h3" sx={dashboardSurfaces.sectionTitle}>
        <SectionToggle
          title={title ?? ''}
          expanded={expanded}
          contentId={contentId}
          testId={toggleTestId}
          onToggle={onToggle}
        />
      </Box>
      {/* children are unmounted while collapsed, so they neither fetch nor poll */}
      <div id={contentId}>{expanded && children}</div>
    </Box>
  )
}
