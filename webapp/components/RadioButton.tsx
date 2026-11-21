import { FormControlLabel, Radio } from '@mui/material'

import { useI18n } from '@webapp/store/system'

type Props = {
  autoFocus?: boolean
  checked?: boolean
  label: string
  labelParams?: Record<string, unknown>
  value: string
  disabled?: boolean
  onClick?: () => void
}

export const RadioButton = (props: Props) => {
  const { autoFocus, checked, label, labelParams, value, disabled, onClick } = props

  const i18n = useI18n()

  return (
    <FormControlLabel
      className="radio-button-group-item"
      value={value}
      control={<Radio autoFocus={autoFocus} checked={checked} disabled={disabled} onClick={onClick} />}
      label={i18n.t(label, labelParams)}
    />
  )
}
