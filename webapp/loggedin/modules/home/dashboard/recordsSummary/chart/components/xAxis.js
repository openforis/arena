import React, { useEffect, useRef } from 'react'

import * as R from 'ramda'
import * as d3 from 'd3'
import DateUtils from '../../../../../../../../common/dateUtils'

const getAxisValues = (from, to) => {
  const fromDate = DateUtils.parseISO(from)
  const toDate = DateUtils.parseISO(to)
  const diff = DateUtils.differenceInDays(toDate, fromDate)
  const noTicks = 4
  const daysSpan = diff / noTicks

  const axisValues = [fromDate]
  for (let i = 1; i <= noTicks; i++) {
    axisValues.push(DateUtils.addDays(fromDate, daysSpan * i))
  }

  return axisValues
}

const getScale = (axisValues, counts, { width, left }) =>
  d3.scaleTime()
    .range([R.isEmpty(counts) ? 0 : left, width])
    .domain([R.head(axisValues), R.last(axisValues)])

const getAxis = (from, to, counts, chartProps) => {

  const axisValues = getAxisValues(from, to)

  return d3.axisBottom(getScale(axisValues, counts, chartProps))
    .tickValues(axisValues)
    .tickFormat(d => DateUtils.format(d, 'dd-MMM-yyyy'))
    .tickSize(5)
    .tickPadding(16)
}

const XAxis = props => {
  const { counts, from, to, chartProps } = props
  const { height, bottom, left, transitionDuration } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)

  // on data update
  useEffect(() => {
    const axis = getAxis(from, to, counts, chartProps)
    axisRef.current = d3.select(elementRef.current).call(axis)
    // update bottom offset
      .attr('transform', () => `translate(0, ${height - bottom})`)
  }, [from, to])

  return (
    <g className="x-axis" ref={elementRef}/>
  )
}

export default XAxis