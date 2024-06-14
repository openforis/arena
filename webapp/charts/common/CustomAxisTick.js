import React from 'react'
import PropTypes from 'prop-types'

import * as StringUtils from '@core/stringUtils'

const labelTextFill = '#666'

export const CustomAxisTick = (props) => {
  const { labelRotation, payload, labelMaxChars, x, y } = props
  const { value } = payload
  const ellipsed = value.length > labelMaxChars
  const valueDisplay = StringUtils.truncate(labelMaxChars)(value)

  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={16} textAnchor="end" fill={labelTextFill} transform={`rotate(${labelRotation})`}>
        {ellipsed && <title>{value}</title>}
        {valueDisplay}
      </text>
    </g>
  )
}

export const RotatedCustomAxisTick = (props) => <CustomAxisTick {...props} labelRotation={-30} />

CustomAxisTick.propTypes = {
  labelRotation: PropTypes.number,
  payload: PropTypes.object.isRequired,
  labelMaxChars: PropTypes.number,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
}

CustomAxisTick.defaultProps = {
  labelRotation: 0,
  labelMaxChars: 14,
}
