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

const margin = {
  top: 10,
  right: 30,
  left: 0,
  bottom: 0,
}

const fillOpacity = '70'

export const AreaChart = (props) => {
  const { data, dataKeys, labelDataKey } = props

  const colors = useRandomColors(dataKeys.length, { onlyDarkColors: true })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsAreaChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={labelDataKey} />
        <YAxis />
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
  data: PropTypes.array.isRequired,
  dataKeys: PropTypes.array.isRequired,
  labelDataKey: PropTypes.string,
  showLegend: PropTypes.bool,
}

AreaChart.defaultProps = {
  labelDataKey: 'name',
  showLegend: true,
}
