import React from 'react'
import PropTypes from 'prop-types'

import { Area, AreaChart as ReChartsAreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'

import { ChartWrapper } from '../common'

const fillOpacity = '70'

const margin = {
  top: 0,
  right: 20,
  bottom: 60,
  left: 0,
}

export const AreaChart = (props) => {
  const { data, allowDecimals, colors: colorsProp, dataKeys, labelDataKey, showLegend } = props

  const randomColors = useRandomColors(dataKeys.length, { onlyDarkColors: true })
  const colors = colorsProp ?? randomColors

  return (
    <ChartWrapper>
      <ReChartsAreaChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey={labelDataKey} angle={-30} dx={-20} dy={40} />
        <YAxis allowDecimals={allowDecimals} />

        <Tooltip />

        {showLegend && <Legend verticalAlign="top" />}

        {dataKeys.map((dataKey, index) => {
          const color = `${colors[index]}${fillOpacity}`
          return <Area key={dataKey} dataKey={dataKey} fill={color} stackId="1" stroke={color} type="monotone" />
        })}
      </ReChartsAreaChart>
    </ChartWrapper>
  )
}

AreaChart.propTypes = {
  allowDecimals: PropTypes.bool,
  colors: PropTypes.array,
  data: PropTypes.array.isRequired,
  dataKeys: PropTypes.array.isRequired,
  labelDataKey: PropTypes.string,
  showLegend: PropTypes.bool,
}

AreaChart.defaultProps = {
  allowDecimals: true,
  labelDataKey: 'name',
  showLegend: false,
}
