import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { BarChart as ReChartsBarChart, Bar, Rectangle, XAxis, YAxis, Tooltip, Legend } from 'recharts'

import { Colors } from '@webapp/utils/colors'

import { CartesianGrid, ChartWrapper, RotatedCustomAxisTick } from '../common'

const layouts = {
  horizontal: 'horizontal',
  vertical: 'vertical',
}

const defaultBarFill = '#3885ca'
const activeBarStroke = '#3885ca'
const maxBarSize = 30
const tickMaxChars = 20
const verticalLayoutYAxisWidth = 150

const margin = {
  top: 0,
  right: 0,
  bottom: 60,
  left: 0,
}

export const BarChart = (props) => {
  const { data, dataColors = [], dataKeys, labelDataKey = 'name', layout = 'horizontal', showLegend = true } = props

  const tickFormatter = useCallback((value) => {
    if (value.length < tickMaxChars) return value
    const truncatedValue = value.substring(0, tickMaxChars)
    return `${truncatedValue}...`
  }, [])

  return (
    <ChartWrapper>
      <ReChartsBarChart data={data} layout={layout} margin={layout === layouts.horizontal ? margin : undefined}>
        <CartesianGrid />
        {layout === layouts.horizontal && (
          <>
            <XAxis dataKey={labelDataKey} tick={RotatedCustomAxisTick} />
            <YAxis />
          </>
        )}
        {layout === layouts.vertical && (
          <>
            <XAxis type="number" />
            <YAxis
              dataKey={labelDataKey}
              tickFormatter={tickFormatter}
              type="category"
              width={verticalLayoutYAxisWidth}
            />
          </>
        )}

        {showLegend && <Legend verticalAlign="top" />}

        <Tooltip cursor={{ fill: 'transparent' }} />
        {dataKeys.map((dataKey, index) => {
          const barFill = dataColors[index] ?? defaultBarFill
          const activeBarFill = Colors.lightenColor(barFill, 10)
          return (
            <Bar
              key={dataKey}
              dataKey={dataKey}
              fill={barFill}
              maxBarSize={maxBarSize}
              activeBar={<Rectangle fill={activeBarFill} stroke={activeBarStroke} />}
            />
          )
        })}
      </ReChartsBarChart>
    </ChartWrapper>
  )
}

BarChart.propTypes = {
  data: PropTypes.array.isRequired,
  dataColors: PropTypes.array,
  dataKeys: PropTypes.array.isRequired,
  labelDataKey: PropTypes.string,
  layout: PropTypes.oneOf(['horizontal', 'vertical', 'centric', 'radial']),
  showLegend: PropTypes.bool,
}
