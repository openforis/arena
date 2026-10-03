import React, { useMemo } from 'react'
import { Area, CartesianGrid, Line, LineChart as ReChartsLineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { convertDateFromISOToDisplay } from '@core/dateUtils'

import { ChartWrapper, RotatedCustomAxisTick } from '@webapp/charts/common'
import { defaultTokens } from '@webapp/theme/tokens'

import { NoRecordsAddedInSelectedPeriod } from '../NoRecordsAddedInSelectedPeriod'

type RecordsCountRow = { date?: string; count?: string | number }

type TotalRecordsSummaryChartProps = {
  counts: RecordsCountRow[]
}

const margin = {
  top: 8,
  right: 20,
  bottom: 60,
  left: 0,
}

const LINE_COLOR = defaultTokens.colors.blue
const AREA_FILL = `${defaultTokens.colors.blue}33`
const GRID_STROKE = defaultTokens.colors.greyBorder
const AXIS_STROKE = defaultTokens.colors.blueDark
const SERIES_NAME = 'Records'

/**
 * Line/area trend of records added over the selected period.
 *
 * @param {TotalRecordsSummaryChartProps} props - The component props.
 * @returns {React.ReactElement} The chart or empty state.
 */
const TotalRecordsSummaryChart = (props: TotalRecordsSummaryChartProps) => {
  const { counts } = props

  const chartData = useMemo(
    () =>
      counts.map(({ date, count }) => ({
        date: convertDateFromISOToDisplay(date),
        count: Number(count),
      })),
    [counts]
  )

  if (chartData.length === 0) return <NoRecordsAddedInSelectedPeriod />

  return (
    <ChartWrapper>
      <ReChartsLineChart data={chartData} margin={margin}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="date" tick={RotatedCustomAxisTick} stroke={AXIS_STROKE} tickLine={false} />
        <YAxis allowDecimals={false} stroke={AXIS_STROKE} tickLine={false} axisLine={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          name={SERIES_NAME}
          stroke="none"
          fill={AREA_FILL}
          fillOpacity={1}
          tooltipType="none"
          activeDot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="count"
          name={SERIES_NAME}
          stroke={LINE_COLOR}
          strokeWidth={2}
          isAnimationActive={false}
          dot={{ r: 3, fill: LINE_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ReChartsLineChart>
    </ChartWrapper>
  )
}

export default TotalRecordsSummaryChart
