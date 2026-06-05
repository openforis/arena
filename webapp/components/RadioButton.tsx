import React from 'react'
import { FormControlLabel, Radio } from '@mui/material'

import { useI18n } from '@webapp/store/system'

type Props = {
  checked?: boolean
  label: string
  labelParams?: Record<string, unknown>
  value: string
  disabled?: boolean
  onClick?: () => void
}

export const RadioButton = (props: Props) => {
  const { checked, label, labelParams, value, disabled, onClick } = props

  const i18n = useI18n()

  return (
    <FormControlLabel
      className="radio-button-group-item"
      value={value}
      control={<Radio checked={checked} disabled={disabled} onClick={onClick} />}
      label={i18n.t(label, labelParams)}
    />
  )
}
