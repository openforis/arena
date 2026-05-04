import './ColorInput.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { MuiColorInput } from 'mui-color-input'

export const ColorInput = (props) => {
  const { disabled = false, onChange, value = '' } = props

  return <MuiColorInput disabled={disabled} format="hex" value={value} onChange={onChange} />
}

ColorInput.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

export default ColorInput
