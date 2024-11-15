import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { FormControlLabel, Radio, RadioGroup } from '@mui/material'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const RadioButtonGroup = (props) => {
  const { className, items, onChange: onChangeProp, row = false, value } = props

  const i18n = useI18n()

  const onChange = useCallback((e) => onChangeProp(e.target.value), [onChangeProp])

  return (
    <RadioGroup className={classNames('radio-button-group', className)} onChange={onChange} row={row} value={value}>
      {items.map((item) => {
        const { key, disabled: itemDisabled, label, labelParams } = item
        return (
          <FormControlLabel
            key={key}
            className="radio-button-group-item"
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
  className: PropTypes.string,
  items: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  row: PropTypes.bool,
  value: PropTypes.string,
}
