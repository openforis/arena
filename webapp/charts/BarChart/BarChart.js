import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import {
  BarChart as ReChartsBarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const margin = {
  top: 5,
  right: 30,
  left: 20,
  bottom: 5,
}

const barFill = '#3885ca'
const activeBarFill = 'green'
const activeBarStroke = '#3885ca'
const maxBarSize = 30
const tickMaxChars = 20

export const BarChart = (props) => {
  const { data, dataKey, labelDataKey, layout, showLegend } = props

  const tickFormatter = useCallback((value) => {
    if (value.length < tickMaxChars) return value
    const truncatedValue = value.substring(0, tickMaxChars)
    return `${truncatedValue}...`
  }, [])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReChartsBarChart data={data} layout={layout} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />
        {layout === 'horizontal' && (
          <>
            <XAxis dataKey={labelDataKey} tickFormatter={tickFormatter} />
            <YAxis />
          </>
        )}
        {layout === 'vertical' && (
          <>
            <XAxis type="number" />
            <YAxis dataKey={labelDataKey} tickFormatter={tickFormatter} type="category" width={250} />
          </>
        )}
        <Tooltip cursor={{ fill: 'transparent' }} />
        {showLegend && <Legend />}
        <Bar
          dataKey={dataKey}
          fill={barFill}
          maxBarSize={maxBarSize}
          stackId="a"
          activeBar={<Rectangle fill={activeBarFill} stroke={activeBarStroke} />}
        />
      </ReChartsBarChart>
    </ResponsiveContainer>
  )
}

BarChart.propTypes = {
  data: PropTypes.array.isRequired,
  dataKey: PropTypes.string.isRequired,
  labelDataKey: PropTypes.string,
  layout: PropTypes.oneOf(['horizontal', 'vertical', 'centric', 'radial']),
  showLegend: PropTypes.bool,
}

BarChart.defaultProps = {
  labelDataKey: 'name',
  layout: 'horizontal',
  showLegend: true,
}
