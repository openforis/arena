import React, { useEffect, useRef } from 'react'
import ReactDOMServer from 'react-dom/server.browser'

import * as d3 from 'd3'
import d3Tip from 'd3-tip'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as DateUtils from '@core/dateUtils'

const DataPointTooltip = ({ dataPoint, i18n }) => (
  <>
    <div className="date">
      {DateUtils.format(DateUtils.parseISO(dataPoint.date), 'dd MMMM yyyy')}
    </div>
    <div className="count">
      {i18n.t('homeView.recordsSummary.record', {
        count: Number(dataPoint.count),
      })}
    </div>
  </>
)

const DataPoints = props => {
  const i18n = useI18n()

  const { counts, chartProps } = props
  const { xScale, yScale, transitionDuration } = chartProps
  const radius = 4
  const elementRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    const tooltipClassName =
      'home-dashboard__records-summary__chart-data-point-tip'
    tooltipRef.current = d3Tip()
      .attr('class', tooltipClassName)
      .offset([-10, 0])
      .html(d =>
        ReactDOMServer.renderToString(
          <DataPointTooltip dataPoint={d} i18n={i18n} />,
        ),
      )

    d3.select(elementRef.current).call(tooltipRef.current)

    return () => {
      document.querySelector(`.${tooltipClassName}`).remove()
    }
  }, [])

  useEffect(() => {
    const circle = d3
      .select(elementRef.current)
      .selectAll('circle')
      .data(counts)

    // Update
    circle
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', radius)
      .style('opacity', '1')

    // Exit
    circle
      .exit()
      .transition()
      .duration(transitionDuration)
      .ease(d3.easePolyOut)
      .attr('cy', yScale(0))
      .style('opacity', '0')
      .remove()

    // Enter
    circle
      .enter()
      .append('circle')
      .on('mouseover', tooltipRef.current.show)
      .on('mouseout', tooltipRef.current.hide)
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
  }, [chartProps])

  return <g className="data-points" ref={elementRef} />
}

export default DataPoints
