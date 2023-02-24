import React from 'react'
import PropTypes from 'prop-types'
import { FormControlLabel, Radio, RadioGroup } from '@mui/material'
import { useI18n } from '@webapp/store/system'

export const RadioButtonGroup = (props) => {
  const { items, onChange, value } = props

  const i18n = useI18n()

  return (
    <RadioGroup value={value} onChange={onChange}>
      {items.map((item) => {
        const { label, value } = item
        return <FormControlLabel key={value} value={value} control={<Radio />} label={i18n.t(label)} />
      })}
    </RadioGroup>
  )
}

RadioButtonGroup.propTypes = {
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}
