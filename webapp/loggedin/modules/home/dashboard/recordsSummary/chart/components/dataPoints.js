import React, { useEffect, useRef } from 'react'

import * as d3 from 'd3'

const DataPoints = props => {
  const { counts, chartProps } = props

  const { xScale, yScale, transitionDuration } = chartProps
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