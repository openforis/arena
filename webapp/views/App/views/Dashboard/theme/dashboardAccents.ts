import type { ElementType } from 'react'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import StorageOutlined from '@mui/icons-material/StorageOutlined'

import { defaultTokens } from '@webapp/theme/tokens'

export type DashboardAccentKind = 'records' | 'contributors' | 'storage'

export type DashboardAccent = {
  color: string
  Icon: ElementType
}

/**
 * Converts a #RRGGBB color to #RRGGBBAA using alpha in [0, 1].
 *
 * @param {string} hex - Six-digit hex color with leading #.
 * @param {number} alpha - Opacity from 0 to 1.
 * @returns {string} Eight-digit hex color.
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const clamped = Math.min(1, Math.max(0, alpha))
  const aa = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex.toLowerCase()}${aa}`
}

const ACCENTS: Record<DashboardAccentKind, DashboardAccent> = {
  records: { color: defaultTokens.colors.blue, Icon: DescriptionOutlined },
  contributors: { color: defaultTokens.colors.green, Icon: GroupOutlined },
  storage: { color: defaultTokens.colors.orange, Icon: StorageOutlined },
}

/**
 * Returns the locked accent color and icon for a KPI kind.
 *
 * @param {DashboardAccentKind} kind - KPI accent kind.
 * @returns {DashboardAccent} Accent definition.
 */
export const getDashboardAccent = (kind: DashboardAccentKind): DashboardAccent => ACCENTS[kind]
