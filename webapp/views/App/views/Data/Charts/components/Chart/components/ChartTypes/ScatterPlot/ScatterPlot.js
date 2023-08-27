import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Function to process the original data
const processData = (originalData, specs) => {
  let xField, yField, categoryField

  if (specs && specs.query && specs.query.xMetric && specs.query.yMetric) {
    xField = specs.query.xMetric.field
    yField = specs.query.yMetric.field
    categoryField = specs.query.category ? specs.query.category.field : null
  } else {
    xField = yField = categoryField = null
  }

  let data = []
  if (originalData && originalData.chartResult) {
    data = originalData.chartResult.map((item) => {
      let newItem = {}
      newItem[xField] = item[xField] !== undefined ? parseFloat(item[xField]) : null
      newItem[yField] = item[yField] !== undefined ? parseFloat(item[yField]) : null
      newItem.category = categoryField && item[categoryField] !== undefined ? item[categoryField] : 'No Category'
      return newItem
    })
    // Filter out data points with NaN x or y values
    data = data.filter((item) => !isNaN(item[xField]) && !isNaN(item[yField]))
  }

  return { data, xField, yField, categoryField }
}

// Function to create the legend
const createLegend = (svg, width, colorScale, data) => {
  if (!data || !Array.isArray(data)) {
    return
  }
  const categories = Array.from(new Set(data.map((d) => d.category)))
  categories.sort()

  const legendSize = 10
  const legendSpacing = 5
  const legendOffset = -80 // Offset from right
  const legend = svg
    .selectAll('.legend')
    .data(categories)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => `translate(0,${i * (legendSize + legendSpacing)})`)

  legend
    .append('rect')
    .attr('x', width - legendSize - legendOffset)
    .attr('width', legendSize)
    .attr('height', legendSize)
    .style('fill', (d) => colorScale(d))

  legend
    .append('text')
    .attr('x', width - legendSize - legendSpacing - legendOffset)
    .attr('y', legendSize / 2)
    .attr('dy', '.35em')
    .style('text-anchor', 'end')
    .text((d) => d)
}

const ScatterPlot = ({ specs, originalData }) => {
  console.log('originalData', originalData)

  const { data, xField, yField, categoryField } = processData(originalData, specs)
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
    const width = 960 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

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
    const categoryMetric = specs.query?.category?.field || 'category'
    const xAxisTitle = specs.chart.xAxisTitle || xField
    const yAxisTitle = specs.chart.yAxisTitle || yField
    const title = specs.chart.title || ''
    const dotSize = specs.chart.dotSize || 5
    const titleSize = specs.chart.titleSize || '20'
    const axisSize = specs.chart.axisSize || '16'
    const ticksSize = specs.chart.ticksSize || '12'
    const showLegend = specs.chart?.showLegend ?? true
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
    <div>
      <div ref={chartRef} />
      <div
        id="tooltip"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid black',
          borderRadius: '5px',
        }}
      ></div>
    </div>
  )
}

export default React.memo(ScatterPlot)
