import React from 'react'
import PropTypes from 'prop-types'
import { LineChart as ReChartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

import { ChartWrapper } from '../common'

const lineStroke = '#8884d8'
const lineFill = '#8884d8'

export const LineChart = (props) => {
  const { allowDecimals, data, dataKey, labelDataKey } = props

  return (
    <ChartWrapper>
      <ReChartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelDataKey} />
        <YAxis allowDecimals={allowDecimals} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={lineStroke} fill={lineFill} />
      </ReChartsLineChart>
    </ChartWrapper>
  )
}

LineChart.propTypes = {
  allowDecimals: PropTypes.bool,
  data: PropTypes.array.isRequired,
  dataKey: PropTypes.string.isRequired,
  labelDataKey: PropTypes.string.isRequired,
}

LineChart.defaultProps = {
  allowDecimals: true,
}
