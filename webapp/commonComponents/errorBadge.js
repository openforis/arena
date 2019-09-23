import './errorBadge.scss'

import React from 'react'

import * as R from 'ramda'

import useI18n from '../commonComponents/useI18n'

import Validation from '../../common/validation/validation'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = props => {

  const {
    validation, children, className: classNameProps,
    showLabel, labelKey, showKeys,
  } = props

  const i18n = useI18n()
  const invalid = !Validation.isValid(validation)

  // when there are warnings add 'warning' class to className
  const className = R.when(
    R.always(Validation.hasWarnings(validation) || Validation.hasWarningsInFields(validation)),
    R.concat('warning ')
  )(classNameProps)

  return invalid
    ? (
      <ValidationTooltip
        validation={validation}
        showKeys={showKeys}
        className={`badge error-badge ${className}`}>

        <div className="badge__content">
          {children}

          <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`}/>

          {
            showLabel &&
            <span>{i18n.t(labelKey)}</span>
          }
        </div>

      </ValidationTooltip>
    )
    : null
}

ErrorBadge.defaultProps = {
  validation: null,
  showLabel: true,
  labelKey: 'common.invalid',
  showKeys: false,
  className: '',
}

export default ErrorBadge