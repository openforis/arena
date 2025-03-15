import './checkbox.scss'

import React, { useCallback } from 'react'
import classNames from 'classnames'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import MuiCheckbox from '@mui/material/Checkbox'
import MuiRadio from '@mui/material/Radio'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { useI18n } from '@webapp/store/system'

import { ButtonIconInfo } from '../buttons/ButtonIconInfo'
import ValidationTooltip from '../validationTooltip'

const Checkbox = (props) => {
  const {
    allowClickEventBubbling = false,
    className,
    checked = false,
    controlStyle = null,
    disabled = false,
    id = null,
    info,
    indeterminate = false,
    label = null,
    onChange: onChangeProp = null,
    radio = false,
    size = 'medium',
    validation = {},
    value,
  } = props

  const i18n = useI18n()

  const onChange = useCallback(
    (event) => {
      if (!allowClickEventBubbling) {
        event.stopPropagation()
      }
      onChangeProp?.(!checked, event)
    },
    [allowClickEventBubbling, onChangeProp, checked]
  )

  const control = radio ? (
    <MuiRadio
      checked={checked}
      data-testid={id}
      data-value={value}
      disabled={disabled}
      onClick={onChange}
      size={size}
      style={controlStyle}
    />
  ) : (
    <MuiCheckbox
      checked={checked}
      data-testid={id}
      data-value={value}
      disabled={disabled}
      indeterminate={indeterminate}
      onClick={onChange}
      size={size}
      style={controlStyle}
    />
  )
  return (
    <div className={classNames('btn-checkbox', className)} style={{ justifySelf: 'start' }}>
      <ValidationTooltip validation={validation}>
        {Objects.isEmpty(label) ? (
          control
        ) : (
          <MuiFormControlLabel className="btn-checkbox-label width100" control={control} label={i18n.t(label)} />
        )}
        {info && <ButtonIconInfo className="info-icon-btn" title={i18n.t(info)} />}
      </ValidationTooltip>
    </div>
  )
}

Checkbox.propTypes = {
  allowClickEventBubbling: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  checked: PropTypes.bool,
  controlStyle: PropTypes.object,
  disabled: PropTypes.bool,
  indeterminate: PropTypes.bool,
  info: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func,
  radio: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  validation: PropTypes.object,
  value: PropTypes.string,
}

export default Checkbox
