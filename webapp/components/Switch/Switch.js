import React, { useCallback } from 'react'
import { FormControlLabel as MuiFormControlLabel, Switch as MUISwitch } from '@mui/material'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

export const Switch = (props) => {
  const { checked = false, disabled = false, label = null, onChange: onChangeProp } = props

  const i18n = useI18n()

  const onChange = useCallback(
    (event) => {
      onChangeProp?.(event.target.checked)
    },
    [onChangeProp]
  )

  const control = <MUISwitch checked={checked} disabled={disabled} onChange={onChange} />

  return label ? <MuiFormControlLabel control={control} label={i18n.t(label)} /> : control
}

Switch.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
}
