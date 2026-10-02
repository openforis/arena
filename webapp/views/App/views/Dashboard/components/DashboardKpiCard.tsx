import React from 'react'
import Box from '@mui/material/Box'
import MuiCard from '@mui/material/Card'
import MuiCardActionArea from '@mui/material/CardActionArea'
import MuiCardContent from '@mui/material/CardContent'
import MuiCollapse from '@mui/material/Collapse'

import { useI18n } from '@webapp/store/system'
import { defaultTokens } from '@webapp/theme/tokens'

import { getDashboardAccent, withAlpha, type DashboardAccentKind } from '../theme/dashboardAccents'
import { dashboardSurfaces } from '../theme/dashboardSurfaces'

export type DashboardKpiCardProps = {
  titleKey: string
  value: string | number
  accent?: DashboardAccentKind
  testId?: string
  expanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

type KpiHeaderProps = {
  title: string
  value: string | number
  expanded: boolean
  expandable: boolean
  accentKind?: DashboardAccentKind
}

const ACCENT_BAR_WIDTH_PX = 4
const ICON_CHIP_ALPHA = 0.12

const KpiHeader = (props: KpiHeaderProps) => {
  const { title, value, expanded, expandable, accentKind } = props
  const accent = accentKind ? getDashboardAccent(accentKind) : null
  const Icon = accent?.Icon

  return (
    <MuiCardContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
        position: 'relative',
        pl: accent ? `${12 + ACCENT_BAR_WIDTH_PX}px` : 2,
      }}
    >
      {accent && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${ACCENT_BAR_WIDTH_PX}px`,
            bgcolor: accent.color,
          }}
        />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: expandable ? 3 : 0 }}>
        {Icon && (
          <Box
            aria-hidden
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: withAlpha(accent.color, ICON_CHIP_ALPHA),
              color: accent.color,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
        <Box
          component="span"
          sx={{
            fontSize: '0.85rem',
            textTransform: 'none',
            color: defaultTokens.colors.blueDark,
            fontWeight: 500,
          }}
        >
          {title}
        </Box>
      </Box>
      <Box
        component="span"
        sx={{ fontSize: '2rem', fontWeight: 600, color: defaultTokens.colors.black, lineHeight: 1.2 }}
      >
        {value}
      </Box>
      {expandable && (
        <Box
          component="span"
          className={`icon icon-ctrl icon-12px${expanded ? ' expanded' : ''}`}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            transition: 'transform 0.2s',
            '&.expanded': { transform: 'rotate(180deg)' },
          }}
        />
      )}
    </MuiCardContent>
  )
}

/**
 * KPI card showing a title and a value, with optional accent and expandable details.
 *
 * @param {DashboardKpiCardProps} props - The component props.
 * @returns {React.ReactElement} The card.
 */
export const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { titleKey, value, accent, testId, expanded = false, onToggleExpand, children } = props
  const i18n = useI18n()

  const title = i18n.t(titleKey) as string
  const expandable = Boolean(onToggleExpand)
  const toggleLabel = i18n.t(
    expanded ? 'homeView:dashboard.kpi.collapseDetails' : 'homeView:dashboard.kpi.expandDetails'
  )

  return (
    <MuiCard data-testid={testId} variant="outlined" sx={dashboardSurfaces.card}>
      {expandable ? (
        <MuiCardActionArea
          aria-expanded={expanded}
          aria-label={`${title}: ${toggleLabel}`}
          onClick={onToggleExpand}
          sx={dashboardSurfaces.kpiActionHover}
        >
          <KpiHeader title={title} value={value} expanded={expanded} expandable accentKind={accent} />
        </MuiCardActionArea>
      ) : (
        <KpiHeader title={title} value={value} expanded={expanded} expandable={false} accentKind={accent} />
      )}
      {children && (
        <MuiCollapse in={expandable ? expanded : true} unmountOnExit>
          <MuiCardContent sx={dashboardSurfaces.detailDivider}>{children}</MuiCardContent>
        </MuiCollapse>
      )}
    </MuiCard>
  )
}
