import * as d3 from 'd3'
import PropTypes from 'prop-types'
import React, { useEffect, useRef } from 'react'
import './ScatterPlot.css'
import { createLegend } from './utils/legend'
import { processData } from './utils/processData'

const ScatterPlot = ({ specs, originalData }) => {
  const { data, xField, yField } = processData(originalData, specs)
  const chartRef = useRef()

  // Shape symbols
  const shapeSymbols = [
    d3.symbolCircle, // Circle
    d3.symbolCross, // Cross
    d3.symbolDiamond, // Diamond
    d3.symbolSquare, // Square
    d3.symbolStar, // Star
    d3.symbolTriangle, // Triangle
    d3.symbolWye, // Wye
  ]

  useEffect(() => {
    renderScatterPlot()
  }, [data, specs])

  const renderScatterPlot = () => {
    // Clear previous SVG, if it exists
    d3.select(chartRef.current).select('svg').remove()

    // Margins and sizes from the specs
    const margin = { top: 50, right: 100, bottom: 50, left: 60 }
    const width = chartRef.current.clientWidth - margin.left - margin.right
    const height = chartRef.current.clientHeight - margin.top - margin.bottom

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales and color scale
    const xScale = d3.scaleLinear().range([0, width])
    const yScale = d3.scaleLinear().range([height, 0])
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Map specs
    const xMetric = specs.query?.xMetric?.field || 'x'
    const yMetric = specs.query?.yMetric?.field || 'y'
    const xAxisTitle = specs.chart.xAxisTitle || xField
    const yAxisTitle = specs.chart.yAxisTitle || yField
    const title = specs.chart.title || ''
    const dotSize = specs.chart.dotSize || 5
    const titleSize = specs.chart.titleSize || '20'
    const axisSize = specs.chart.axisSize || '16'
    const ticksSize = specs.chart.ticksSize || '12'
    const showLegend = specs.chart.showLegend ?? true
    const xMax = parseFloat(specs.chart.xMax) || d3.max(data, (d) => d[xMetric])
    const xMin = parseFloat(specs.chart.xMin) || d3.min(data, (d) => d[xMetric])
    const yMax = parseFloat(specs.chart.yMax) || d3.max(data, (d) => d[yMetric])
    const yMin = parseFloat(specs.chart.yMin) || d3.min(data, (d) => d[yMetric])

    // Domain for scales
    xScale.domain([xMin, xMax]).nice()
    yScale.domain([yMin, yMax]).nice()

    // Create and append axes
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale).ticks().tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', ticksSize + 'px')

    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks().tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', ticksSize + 'px')

    // Create a symbol generator
    let symbolGenerator = d3.symbol()

    // Add a shape scale
    const categories = Array.from(new Set(data.map((d) => d.category)))
    const shapeScale = d3
      .scaleOrdinal()
      .domain(categories)
      .range(categories.map((value, i) => shapeSymbols[i % shapeSymbols.length]))
    // Draw points on the graph
    svg
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('path')
      .attr('class', 'dot')
      .attr('transform', (d) => 'translate(' + xScale(d[xField]) + ',' + yScale(d[yField]) + ')')
      .attr('d', symbolGenerator.size(dotSize * 20)) // size is area, so we need to increase it relative to the radius used before
      .style('fill', (d) => colorScale(d.category))
      .on('mouseover', function (event, d) {
        // Show the tooltip and set its content and position
        d3.select('#tooltip')
          .style('visibility', 'visible')
          .html(`x: ${d[xField]}<br/>y: ${d[yField]}<br/>category: ${d.category}`)
          .style('left', event.pageX + 15 + 'px')
          .style('top', event.pageY - 30 + 'px')
      })
      .on('mouseout', function () {
        // Hide the tooltip
        d3.select('#tooltip').style('visibility', 'hidden')
      })
      .attr('d', (d) => symbolGenerator.type(shapeScale(d.category))()) // Here we set the symbol type

    // Append x axis title
    svg
      .append('text')
      .attr('transform', 'translate(' + width / 2 + ' ,' + (height + margin.bottom - 10) + ')')
      .style('text-anchor', 'middle')
      .style('font-size', axisSize + 'px')
      .style('text-decoration', 'none') // Add this line
      .text(xAxisTitle)

    // Append y axis title
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', axisSize + 'px')
      .text(yAxisTitle)

    // Append chart title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', titleSize + 'px')
      .style('text-decoration', 'none')
      .text(title)

    // Create legend
    if (showLegend && data.length > 0) {
      createLegend(svg, width, colorScale, data)
    }
  }

  return (
    <div className="chart-container" ref={chartRef}>
      <div id="tooltip"></div>
    </div>
  )
}

ScatterPlot.propTypes = {
  specs: PropTypes.shape({
    query: PropTypes.shape({
      xMetric: PropTypes.shape({
        field: PropTypes.string.isRequired,
      }).isRequired,
      yMetric: PropTypes.shape({
        field: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    chart: PropTypes.shape({
      xAxisTitle: PropTypes.string,
      yAxisTitle: PropTypes.string,
      title: PropTypes.string,
      dotSize: PropTypes.number,
      titleSize: PropTypes.string,
      axisSize: PropTypes.string,
      ticksSize: PropTypes.string,
      showLegend: PropTypes.bool,
      xMax: PropTypes.string,
      xMin: PropTypes.string,
      yMax: PropTypes.string,
      yMin: PropTypes.string,
    }).isRequired,
  }).isRequired,
  originalData: PropTypes.array.isRequired,
}

export default React.memo(ScatterPlot)
