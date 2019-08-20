import React, { useEffect, useRef } from 'react'

import * as R from 'ramda'
import * as d3 from 'd3'

const yMaxValue = 98765

const getScale = (data, { height, bottom, top }) => {
  const max = R.pipe(
    R.map(o => d3.max(o, d => d.count)),
    R.defaultTo(yMaxValue),
    v => v > 0 ? v : yMaxValue
  )(data)

  return d3.scaleLinear()
    .domain([0, max])
    .range([height - bottom, top])
}

const getAxis = (data, chartProps) => d3.axisLeft(getScale(data, chartProps))
  .ticks(6)
  .tickSizeInner(-chartProps.width)
  .tickSizeOuter(0)
  .tickFormat(d3.format(',.0f'))
  .tickPadding(8)

const YAxis = props => {
  const { data, chartProps } = props
  const { left, transitionDuration } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)


  // on data update
  useEffect(() => {
    const axis = getAxis(data, chartProps)
    axisRef.current = d3.select(elementRef.current).call(axis)

    // update left offset
    axisRef.current
      .transition()
      .ease(d3.easePolyOut)
      .duration(transitionDuration)
      .attr('transform', () => `translate(${R.isEmpty(data) ? 0 : left}, 0)`)
  }, [data])

  return (
    <g className="y-axis" ref={elementRef}/>
  )
}

export default YAxis