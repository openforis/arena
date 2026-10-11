import React from 'react'
import type { ReactElement } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapWorkspace } from '../MapWorkspaceContext'

type ToolbarIconButtonProps = {
  buttonKey: string
  titleKey: string
  shortcut?: string
  iconClassName?: string
  iconSrc?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

/**
 * Quick button of the top bar, with a tooltip "Label (Key)".
 * @param {object} props - Component props.
 * @param {string} props.buttonKey - Button key (test id suffix).
 * @param {string} props.titleKey - I18n key of the label.
 * @param {string} [props.shortcut] - Shortcut shown in the tooltip.
 * @param {string} [props.iconClassName] - Icon class (when no iconSrc).
 * @param {string} [props.iconSrc] - Image URL of the icon.
 * @param {boolean} [props.active] - Toggle state (sets aria-pressed); undefined for plain buttons.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 * @param {Function} props.onClick - Action.
 * @returns {React.ReactElement} The button.
 */
export const ToolbarIconButton = ({
  buttonKey,
  titleKey,
  shortcut,
  iconClassName,
  iconSrc,
  active,
  disabled = false,
  onClick,
}: ToolbarIconButtonProps): ReactElement => {
  const t = useI18nT()
  const { portalContainer } = useMapWorkspace()
  const label = t(titleKey)
  const title = shortcut ? `${label} (${shortcut})` : label
  return (
    <Tooltip title={title} slotProps={{ popper: { container: portalContainer } }}>
      {/* the span keeps the tooltip working on a disabled button */}
      <span>
        <IconButton
          size="small"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={classNames('map-toolbar__icon-button', { 'map-toolbar__icon-button--active': active })}
          data-testid={TestId.mapWorkspace.quickButton(buttonKey)}
        >
          {iconSrc ? (
            <img src={iconSrc} alt="" width={18} height={18} />
          ) : (
            <span className={`icon icon-16px ${iconClassName}`} aria-hidden="true" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  )
}
