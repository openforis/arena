import './checkbox.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { useI18n } from '@webapp/store/system'

import ValidationTooltip from '../validationTooltip'
import { LabelWithTooltip } from './LabelWithTooltip'
import { ButtonIconInfo } from '../buttons'

const determineIconClassName = ({ radio, checked, indeterminate }) => {
  if (radio) {
    return checked ? 'icon-radio-checked' : 'icon-radio-unchecked'
  }
  if (indeterminate) {
    return 'icon-stop2'
  }
  return checked ? 'icon-checkbox-checked' : 'icon-checkbox-unchecked'
}

const Checkbox = (props) => {
  const {
    className,
    id,
    validation,
    checked,
    indeterminate,
    info,
    label,
    onChange: onChangeProp,
    disabled,
    radio,
  } = props

  const i18n = useI18n()

  const onChange = useCallback(
    (event) => {
      event.stopPropagation()
      onChangeProp?.(!checked)
    },
    [onChangeProp, checked]
  )

  const hasLabel = !Objects.isEmpty(label)
  const iconClassName = determineIconClassName({ radio, checked, indeterminate })
  const iconContainerClassName = classNames(`icon icon-18px ${iconClassName}`, { ['icon-left']: hasLabel })

  return (
    <div className={className} style={{ justifySelf: 'start' }}>
      <ValidationTooltip validation={validation}>
        <button
          type="button"
          data-testid={id}
          className="btn btn-s btn-transparent btn-checkbox"
          onClick={onChange}
          aria-disabled={disabled}
        >
          <span className={iconContainerClassName} />
          <LabelWithTooltip label={i18n.t(label)} />
          {info && <ButtonIconInfo className="info-icon-btn" title={i18n.t(info)} />}
        </button>
      </ValidationTooltip>
    </div>
  )
}

Checkbox.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  indeterminate: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func,
  radio: PropTypes.bool,
  validation: PropTypes.object,
}

Checkbox.defaultProps = {
  id: null,
  checked: false,
  disabled: false,
  indeterminate: false,
  label: null,
  onChange: null,
  radio: false,
  validation: {},
}

export default Checkbox
