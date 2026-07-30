import React from 'react'

import SvgIcon from '@mui/material/SvgIcon'
import Tooltip from '@mui/material/Tooltip'

import { useI18n } from '@webapp/store/system'
import { defaultTokens } from '@webapp/theme/tokens'

type Props = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
}

/**
 * Renders a validation/completion status icon for a record page tree item.
 *
 * @param hasErrors - Whether the scoped page(s) have validation errors
 * @param hasWarnings - Whether the scoped page(s) have validation warnings
 * @param isComplete - Whether the scoped page(s) are fully complete
 * @returns Status icon element, or null when no status applies
 */
export const RecordPageStatusIcon = ({ hasErrors, hasWarnings, isComplete }: Props) => {
  const i18n = useI18n()

  if (hasErrors) {
    return (
      <Tooltip title={i18n.t('common.error_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.red, flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  if (hasWarnings) {
    return (
      <Tooltip title={i18n.t('common.warning_plural')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.orange, flexShrink: 0 }}>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  if (isComplete) {
    return (
      <Tooltip title={i18n.t('surveyForm:pageComplete')}>
        <SvgIcon sx={{ fontSize: 16, color: defaultTokens.colors.green, flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </SvgIcon>
      </Tooltip>
    )
  }
  return null
}
