import './ChartWrapper.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { ResponsiveContainer } from 'recharts'

export const ChartWrapper = (props) => {
  const { children, height = '100%', width = '100%' } = props

  return (
    <ResponsiveContainer height={height} width={width}>
      {children}
    </ResponsiveContainer>
  )
}

ChartWrapper.propTypes = {
  children: PropTypes.node,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}
