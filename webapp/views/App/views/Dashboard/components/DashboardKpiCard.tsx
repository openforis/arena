import './DashboardKpiCard.scss'

import React from 'react'
import MuiCard from '@mui/material/Card'
import MuiCardActionArea from '@mui/material/CardActionArea'
import MuiCardContent from '@mui/material/CardContent'
import MuiCollapse from '@mui/material/Collapse'

import { useI18n } from '@webapp/store/system'

export type DashboardKpiCardProps = {
  titleKey: string
  value: string | number
  testId?: string
  expanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
}

type KpiHeaderProps = Pick<DashboardKpiCardProps, 'value' | 'expanded'> & { title: string; expandable: boolean }

const KpiHeader = (props: KpiHeaderProps) => {
  const { title, value, expanded, expandable } = props
  return (
    <MuiCardContent className="dashboard-kpi-card__header">
      <span className="dashboard-kpi-card__title">{title}</span>
      <span className="dashboard-kpi-card__value">{value}</span>
      {expandable && (
        <span className={`icon icon-ctrl icon-12px dashboard-kpi-card__expand-icon${expanded ? ' expanded' : ''}`} />
      )}
    </MuiCardContent>
  )
}

/**
 * KPI card showing a title and a value, with optional expandable details.
 *
 * @param {DashboardKpiCardProps} props - The component props.
 * @returns {React.ReactElement} The card.
 */
export const DashboardKpiCard = (props: DashboardKpiCardProps) => {
  const { titleKey, value, testId, expanded = false, onToggleExpand, children } = props
  const i18n = useI18n()

  const title = i18n.t(titleKey) as string
  const expandable = Boolean(onToggleExpand)
  const toggleLabel = i18n.t(
    expanded ? 'homeView:dashboard.kpi.collapseDetails' : 'homeView:dashboard.kpi.expandDetails'
  )

  return (
    <MuiCard className="dashboard-kpi-card" data-testid={testId} variant="outlined">
      {expandable ? (
        <MuiCardActionArea aria-expanded={expanded} aria-label={`${title}: ${toggleLabel}`} onClick={onToggleExpand}>
          <KpiHeader title={title} value={value} expanded={expanded} expandable />
        </MuiCardActionArea>
      ) : (
        <KpiHeader title={title} value={value} expanded={expanded} expandable={false} />
      )}
      {children && (
        <MuiCollapse in={expandable ? expanded : true} unmountOnExit>
          <MuiCardContent className="dashboard-kpi-card__details">{children}</MuiCardContent>
        </MuiCollapse>
      )}
    </MuiCard>
  )
}
