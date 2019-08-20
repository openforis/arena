import React, { useEffect, useRef } from 'react'

import * as R from 'ramda'
import * as d3 from 'd3'

const yMaxValue = 98765

const getScale = (counts, { height, bottom, top }) => {
  const max = R.pipe(
    R.map(o => d3.max(o, d => d.count)),
    R.defaultTo(yMaxValue),
    v => v > 0 ? v : yMaxValue
  )(counts)

  return d3.scaleLinear()
    .domain([0, max])
    .range([height - bottom, top])
}

const getAxis = (counts, chartProps) => d3.axisLeft(getScale(counts, chartProps))
  .ticks(6)
  .tickSizeInner(-chartProps.width)
  .tickSizeOuter(0)
  .tickFormat(d3.format(',.0f'))
  .tickPadding(8)

const YAxis = props => {
  const { counts, chartProps } = props
  const { left, transitionDuration } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)


  // on data update
  useEffect(() => {
    const axis = getAxis(counts, chartProps)
    axisRef.current = d3.select(elementRef.current).call(axis)

    // update left offset
    axisRef.current
      .transition()
      .ease(d3.easePolyOut)
      .duration(transitionDuration)
      .attr('transform', () => `translate(${R.isEmpty(counts) ? 0 : left}, 0)`)
  }, [counts])

  return (
    <g className="y-axis" ref={elementRef}/>
  )
}

export default YAxis