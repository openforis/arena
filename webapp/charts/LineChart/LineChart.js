import React from 'react'
import PropTypes from 'prop-types'
import { CartesianGrid, Legend, Line, LineChart as ReChartsLineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartWrapper } from '../common'

const margin = {
  top: 0,
  right: 20,
  bottom: 70,
  left: 0,
}

const defaultLineFill = '#8884d8'

export const LineChart = (props) => {
  const { allowDecimals, data, dataColors, dataKeys, labelDataKey, showLegend } = props

  return (
    <ChartWrapper>
      <ReChartsLineChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelDataKey} angle={-30} dy={40} />
        <YAxis allowDecimals={allowDecimals} />
        {showLegend && <Legend verticalAlign="top" />}
        <Tooltip />
        {dataKeys.map((dataKey, index) => {
          const color = dataColors?.[index] ?? defaultLineFill
          return <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={color} fill={color} />
        })}
      </ReChartsLineChart>
    </ChartWrapper>
  )
}

LineChart.propTypes = {
  allowDecimals: PropTypes.bool,
  data: PropTypes.array.isRequired,
  dataColors: PropTypes.array,
  dataKeys: PropTypes.array.isRequired,
  labelDataKey: PropTypes.string.isRequired,
  showLegend: PropTypes.bool,
}

LineChart.defaultProps = {
  allowDecimals: true,
  showLegend: false,
}
