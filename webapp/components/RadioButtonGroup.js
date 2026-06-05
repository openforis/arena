import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { RadioGroup } from '@mui/material'
import classNames from 'classnames'

import { RadioButton } from './RadioButton'

export const RadioButtonGroup = (props) => {
  const { className, items, onChange: onChangeProp, row = false, value } = props

  const onChange = useCallback((e) => onChangeProp(e.target.value), [onChangeProp])

  return (
    <RadioGroup className={classNames('radio-button-group', className)} onChange={onChange} row={row} value={value}>
      {items.map((item) => {
        const { key, disabled, label, labelParams } = item
        return <RadioButton key={key} value={key} label={label} labelParams={labelParams} disabled={disabled} />
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
