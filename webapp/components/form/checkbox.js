import './checkbox.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import MuiCheckbox from '@mui/material/Checkbox'
import MuiRadio from '@mui/material/Radio'

import { Objects } from '@openforis/arena-core'

import { useI18n } from '@webapp/store/system'

import { ButtonIconInfo } from '../buttons/ButtonIconInfo'
import ValidationTooltip from '../validationTooltip'
import classNames from 'classnames'

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

  const control = radio ? (
    <MuiRadio checked={checked} data-testid={id} disabled={disabled} onClick={onChange} />
  ) : (
    <MuiCheckbox
      checked={checked}
      data-testid={id}
      disabled={disabled}
      indeterminate={indeterminate}
      onClick={onChange}
    />
  )
  return (
    <div className={classNames(className, 'btn-checkbox')} style={{ justifySelf: 'start' }}>
      <ValidationTooltip validation={validation}>
        {Objects.isEmpty(label) ? (
          control
        ) : (
          <MuiFormControlLabel className="full-width" control={control} label={i18n.t(label)} />
        )}
        {info && <ButtonIconInfo className="info-icon-btn" title={i18n.t(info)} />}
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
