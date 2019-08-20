import React, { useEffect, useRef } from 'react'

import * as R from 'ramda'
import * as d3 from 'd3'

const maxValue = new Date()

const getScale = (data, { width, left }) =>
  d3.scaleTime()
    .range([R.isEmpty(data) ? 0 : left, width])
    .domain(d3.extent(data, d => new Date(d.date)))

const getAxis = (data, chartProps) =>
  d3.axisBottom(getScale(data, chartProps))
    .tickValues(data.map(d => new Date(d.date)))
    .tickFormat(d3.timeFormat('%d-%b-%y'))
    .tickSize(1)
    .tickPadding(16)

const XAxis = props => {
  const { data, chartProps } = props
  const { height, bottom, left, transitionDuration } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)

  // on data update
  useEffect(() => {
    const axis = getAxis(data, chartProps)
    axisRef.current = d3.select(elementRef.current).call(axis)
    // update bottom offset
      .attr('transform', () => `translate(0, ${height - bottom})`)
  }, [data])

  return (
    <g className="x-axis" ref={elementRef}/>
  )
}

export default XAxis