import React from 'react'
import PropTypes from 'prop-types'

import {
  Area,
  AreaChart as ReChartsAreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'

const fillOpacity = '70'

export const AreaChart = (props) => {
  const { data, allowDecimals, colors: colorsProp, dataKeys, labelDataKey } = props

  const randomColors = useRandomColors(dataKeys.length, { onlyDarkColors: true })
  const colors = colorsProp ?? randomColors

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelDataKey} />
        <YAxis allowDecimals={allowDecimals} />
        <Tooltip />
        {dataKeys.map((dataKey, index) => {
          const color = `${colors[index]}${fillOpacity}`
          return <Area key={dataKey} dataKey={dataKey} fill={color} stackId="1" stroke={color} type="monotone" />
        })}
      </ReChartsAreaChart>
    </ResponsiveContainer>
  )
}

AreaChart.propTypes = {
  allowDecimals: PropTypes.bool,
  colors: PropTypes.array,
  data: PropTypes.array.isRequired,
  dataKeys: PropTypes.array.isRequired,
  labelDataKey: PropTypes.string,
}

AreaChart.defaultProps = {
  allowDecimals: true,
  labelDataKey: 'name',
}
