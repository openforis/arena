import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import * as R from 'ramda'

const getMax = (counts) => counts.reduce((maxAcc, item) => Math.max(maxAcc, item.count), 0)

export const getScale = (counts, { height, bottom, top }) =>
  d3
    .scaleLinear()
    .domain([0, getMax(counts) || 98765])
    .range([height - bottom, top])

const getAxis = (counts, chartProps) =>
  d3
    .axisLeft(getScale(counts, chartProps))
    .ticks(Math.min(getMax(counts), 5))
    .tickSizeInner(-(chartProps.width - chartProps.right - chartProps.left))
    .tickSizeOuter(0)
    .tickFormat(d3.format(',.0f'))
    .tickPadding(8)

const YAxis = (props) => {
  const { counts, chartProps } = props
  const { left, transitionDuration } = chartProps

  const elementRef = useRef(null)
  const axisRef = useRef(null)

  // On data update
  useEffect(() => {
    const axis = getAxis(counts, chartProps)
    axisRef.current = d3.select(elementRef.current).call(axis)

    // Update left offset
    axisRef.current
      .transition()
      .ease(d3.easePolyOut)
      .duration(transitionDuration)
      .attr('transform', () => `translate(${R.isEmpty(counts) ? 0 : left}, 0)`)
  }, [chartProps])

  return <g className="y-axis" ref={elementRef} />
}

YAxis.propTypes = {
  counts: PropTypes.array.isRequired,
  chartProps: PropTypes.object.isRequired,
}

export default YAxis
