import './ErrorBadge.scss'

import classNames from 'classnames'
import type React from 'react'

import type { ArenaValidation } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import { useI18n } from '@webapp/store/system'

import ValidationTooltip from './ValidationTooltip'

type ErrorBadgeProps = {
  children?: React.ReactNode
  className?: string
  id?: string
  insideTable?: boolean
  labelKey?: string
  showIcon?: boolean
  showKeys?: boolean
  showLabel?: boolean
  validation?: ArenaValidation
}

const ErrorBadge = (props: ErrorBadgeProps) => {
  const {
    children = null,
    className = '',
    id = null,
    labelKey = 'common.invalid',
    showIcon = false,
    showKeys = false,
    showLabel = true,
    validation = null,
    insideTable = false,
  } = props

  const i18n = useI18n()
  const valid = Validation.isValid(validation)

  if (valid) return children

  const error = Validation.isError(validation)
  const warning = !error && Validation.isWarning(validation)

  return (
    <ValidationTooltip
      validation={validation}
      showKeys={showKeys}
      className={classNames(className, 'badge', 'error-badge', { error, warning })}
      id={id}
      insideTable={insideTable}
    >
      <div className="badge__content">
        {children}

        {showIcon && <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`} />}

        {showLabel && <span>{i18n.t(labelKey)}</span>}
      </div>
    </ValidationTooltip>
  )
}

export default ErrorBadge
