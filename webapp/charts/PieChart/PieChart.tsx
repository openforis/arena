import type React from 'react'
import { Cell, Legend, Pie, PieChart as ReChartsPieChart, Tooltip } from 'recharts'

import { ChartWrapper } from '../common'

const fill = '#8884d8'

type PieChartProps = {
  children?: React.ReactNode
  colorKey?: string
  data: any[]
  dataKey?: string
  endAngle?: number
  height?: number | `${number}%`
  innerRadius?: number
  label?: boolean | ((...args: any[]) => any)
  outerRadius?: number
  showLabelLine?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  startAngle?: number
  width?: number | `${number}%`
}

export const PieChart = (props: PieChartProps) => {
  const {
    data,
    colorKey = 'color',
    children,
    dataKey = 'value',
    endAngle = -270,
    height = '100%',
    innerRadius,
    label = true,
    outerRadius,
    startAngle = 90,
    showLabelLine = true,
    showLegend = true,
    showTooltip = true,
    width = '100%',
  } = props

  return (
    <ChartWrapper width={width} height={height}>
      <ReChartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          endAngle={endAngle}
          fill={fill}
          innerRadius={innerRadius}
          label={label}
          outerRadius={outerRadius}
          labelLine={showLabelLine}
          startAngle={startAngle}
        >
          {data.map((item) => (
            <Cell key={item.name} fill={item[colorKey]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {children}
      </ReChartsPieChart>
    </ChartWrapper>
  )
}
