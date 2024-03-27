import './errorBadge.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = (props) => {
  const { children, className, id, labelKey, showIcon, showLabel, showKeys, validation, insideTable } = props

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

ErrorBadge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  labelKey: PropTypes.string,
  showIcon: PropTypes.bool,
  showKeys: PropTypes.bool,
  showLabel: PropTypes.bool,
  validation: PropTypes.object,
}

ErrorBadge.defaultProps = {
  children: null,
  className: '',
  id: null,
  labelKey: 'common.invalid',
  showIcon: false,
  showKeys: false,
  showLabel: true,
  validation: null,
}

export default ErrorBadge
