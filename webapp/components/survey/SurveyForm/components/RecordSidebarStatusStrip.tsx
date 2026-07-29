import React from 'react'

import Box from '@mui/material/Box'
import SvgIcon from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'

import { useI18n } from '@webapp/store/system'
import { useRecordPageValidationStatus } from '@webapp/store/ui/record'
import { defaultTokens } from '@webapp/theme/tokens'

type Props = {
  pageNodeDefUuids: string[]
}

const ITEM_HEIGHT_PX = 32

type StatusIconProps = {
  pageNodeDefUuid: string
}

/**
 * Renders a single validation status icon for one page node def.
 */
const StatusIcon = ({ pageNodeDefUuid }: StatusIconProps) => {
  const i18n = useI18n()
  const { hasErrors, hasWarnings } = useRecordPageValidationStatus(pageNodeDefUuid)

  if (hasErrors) {
    return (
      <Tooltip title={i18n.t('common.error_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.red }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  if (hasWarnings) {
    return (
      <Tooltip title={i18n.t('common.warning_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.orange }}>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  return null
}

/**
 * A narrow strip of per-page validation status icons rendered alongside
 * the sidebar navigation tree. Each slot aligns with its corresponding
 * tree row. Visible only in record entry mode.
 *
 * @param pageNodeDefUuids - ordered list of page node def UUIDs currently
 *   rendered in the sidebar tree
 * @returns JSX element with one icon slot per page node def
 */
export const RecordSidebarStatusStrip = ({ pageNodeDefUuids }: Props) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 24,
        flexShrink: 0,
      }}
    >
      {pageNodeDefUuids.map((uuid) => (
        <Box
          key={uuid}
          sx={{
            height: ITEM_HEIGHT_PX,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StatusIcon pageNodeDefUuid={uuid} />
        </Box>
      ))}
    </Box>
  )
}
