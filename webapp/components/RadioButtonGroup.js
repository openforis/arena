import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { FormControlLabel, Radio, RadioGroup } from '@mui/material'
import { useI18n } from '@webapp/store/system'

export const RadioButtonGroup = (props) => {
  const { items, onChange: onChangeProp, row, value } = props

  const i18n = useI18n()

  const onChange = useCallback((e) => onChangeProp(e.target.value), [onChangeProp])

  return (
    <RadioGroup onChange={onChange} row={row} value={value}>
      {items.map((item) => {
        const { key, disabled: itemDisabled, label, labelParams } = item
        return (
          <FormControlLabel
            key={key}
            value={key}
            control={<Radio disabled={itemDisabled} />}
            label={i18n.t(label, labelParams)}
          />
        )
      })}
    </RadioGroup>
  )
}

RadioButtonGroup.propTypes = {
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  row: PropTypes.bool,
  value: PropTypes.string,
}

RadioButtonGroup.defaultProps = {
  row: false,
}
