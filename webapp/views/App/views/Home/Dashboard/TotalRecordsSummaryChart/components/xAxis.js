import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'

const getAxisValues = (from, to) => {
  const fromDate = DateUtils.parseISO(from)
  const toDate = DateUtils.parseISO(to)
  const diff = DateUtils.differenceInDays(toDate, fromDate)
  const noTicks = 5
  const daysSpan = diff / noTicks

  const axisValues = [fromDate]
  for (let i = 1; i <= noTicks; i++) {
    axisValues.push(DateUtils.addDays(fromDate, daysSpan * i))
  }

  return axisValues
}

export const getScale = (counts, from, to, { width, left, right }) =>
  d3
    .scaleTime()
    .range([R.isEmpty(counts) ? 0 : left, width - right])
    .domain([DateUtils.parseISO(from), DateUtils.parseISO(to)])

const getAxis = (from, to, counts, chartProps) =>
  d3
    .axisBottom(getScale(counts, from, to, chartProps))
    .tickValues(getAxisValues(from, to))
    .tickFormat((d) => DateUtils.format(d, 'dd-MMM-yyyy')) // TODO put year on a new line https://bl.ocks.org/mbostock/7555321
    .tickSize(5)
    .tickPadding(15)

const XAxis = (props) => {
  const { counts, from, to, chartProps } = props
  const { height, bottom } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)

  // On data update
  useEffect(() => {
    const axis = getAxis(from, to, counts, chartProps)
    axisRef.current = d3
      .select(elementRef.current)
      .call(axis)
      // Update bottom offset
      .attr('transform', () => `translate(0, ${height - bottom})`)
  }, [chartProps])

  return <g className="x-axis" ref={elementRef} />
}

XAxis.propTypes = {
  counts: PropTypes.array.isRequired,
  chartProps: PropTypes.object.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
}

export default XAxis
