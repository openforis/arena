import type { ElementType } from 'react'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import StorageOutlined from '@mui/icons-material/StorageOutlined'

import { themeColors } from '@webapp/theme/tokens'

export type DashboardAccentKind = 'records' | 'contributors' | 'storage'

export type DashboardAccent = {
  color: string
  Icon: ElementType
}

/**
 * Returns the color with the given opacity; works with CSS variables too (e.g. theme colors).
 *
 * @param {string} color - CSS color or CSS variable reference.
 * @param {number} alpha - Opacity from 0 to 1.
 * @returns {string} The CSS color expression.
 */
export const withAlpha = (color: string, alpha: number): string => {
  const percent = Math.round(Math.min(1, Math.max(0, alpha)) * 100)
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const ACCENTS: Record<DashboardAccentKind, DashboardAccent> = {
  records: { color: themeColors.primary, Icon: DescriptionOutlined },
  contributors: { color: themeColors.success, Icon: GroupOutlined },
  storage: { color: themeColors.warning, Icon: StorageOutlined },
}

/**
 * Returns the locked accent color and icon for a KPI kind.
 *
 * @param {DashboardAccentKind} kind - KPI accent kind.
 * @returns {DashboardAccent} Accent definition.
 */
export const getDashboardAccent = (kind: DashboardAccentKind): DashboardAccent => ACCENTS[kind]
