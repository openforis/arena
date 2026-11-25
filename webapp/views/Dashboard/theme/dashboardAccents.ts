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
