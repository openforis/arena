import { useCallback } from 'react'
import { FormControlLabel as MuiFormControlLabel, Switch as MUISwitch } from '@mui/material'

import { useI18n } from '@webapp/store/system'

type SwitchProps = {
  checked?: boolean
  disabled?: boolean
  label?: string
  onChange?: (...args: any[]) => any
}

export const Switch = (props: SwitchProps) => {
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
