import React, { useEffect, useRef } from 'react'

import * as d3 from 'd3'
import DateUtils from '../../../../../../../../common/dateUtils'

import { getScale as getXScale } from './xAxis'
import { getScale as getYScale } from './yAxis'

const DataPoints = props => {
  const { counts, from, to, chartProps } = props

  const { transitionDuration } = chartProps
  const xScale = date => getXScale(counts, from, to, chartProps)(DateUtils.parseISO(date))
  const yScale = getYScale(counts, chartProps)
  const radius = 3
  const elementRef = useRef(null)

  useEffect(() => {
    const circle = d3.select(elementRef.current)
      .selectAll('circle')
      .data(counts)

    //update
    circle
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', radius)
      .style('opacity', '1')

    //exit
    circle.exit()
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .attr('cy', yScale(0))
      .style('opacity', '0')
      .remove()

    //enter
    circle.enter().append('circle')
      .attr('r', 0)
      .attr('cx', d => xScale(d.date))
      .attr('cy', yScale(0))
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', radius)
      .style('opacity', '1')
  }, [counts])

  return (
    <g className="data-points" ref={elementRef}/>
  )
}

export default DataPoints