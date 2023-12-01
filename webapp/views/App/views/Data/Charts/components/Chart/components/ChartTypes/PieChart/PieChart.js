import * as d3 from 'd3'
import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import './PieChart.css'
import { processData } from './utils/processData'

const PieChart = ({ specs, originalData, chartRef }) => {
  const { data, categoryField, valueField } = processData(originalData, specs)

  useEffect(() => {
    renderPieChart()
  }, [data, specs])

  const renderPieChart = () => {
    // Clear previous SVG, if it exists
    d3.select(chartRef.current).select('svg').remove()

    // Margins and sizes from the specs
    const margin = { top: 50, right: 100, bottom: 50, left: 100 }
    const width = chartRef.current.clientWidth - margin.left - margin.right
    const height = chartRef.current.clientHeight - margin.top - margin.bottom
    const radius = Math.min(width, height) / 2

    // Create SVG container
    const svgContainer = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // Create SVG group
    const svg = svgContainer
      .append('g')
      .attr('transform', `translate(${width / 2 + margin.left},${height / 2 + margin.top + 20})`) // Added 20px to move it down

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Pie generator
    const pie = d3.pie().value((d) => d[valueField])

    // Map specs
    const { title, titleSize, showLegend, innerRadius } = mapSpecs(specs)

    // Draw pie
    drawPie(svg, data, pie, radius, colorScale, categoryField, innerRadius)

    // Append chart title
    appendChartTitle(svgContainer, width, margin, titleSize, title)

    // Create legend
    if (showLegend) {
      createLegend(svg, colorScale, data, radius)
    }
  }

  const createLegend = (svg, colorScale, data, radius) => {
    const legend = svg
      .selectAll('.legend')
      .data(colorScale.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(0,${(i - data.length / 2) * 20})`)

    legend
      .append('rect')
      .attr('x', radius + 20)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', colorScale)

    legend
      .append('text')
      .attr('x', radius + 40)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .text((d, i) => data[i][categoryField])
  }

  const mapSpecs = (specs) => {
    const title = specs.chart.title || ''
    const titleSize = specs.chart.titleSize || '20'
    const showLegend = specs.chart.showLegend || false
    const innerRadius = specs.chart.innerRadius || '0'

    return {
      title,
      titleSize,
      showLegend,
      innerRadius,
    }
  }

  const drawPie = (svg, data, pie, radius, colorScale, categoryField, innerRadiusPercentage) => {
    const innerRadius = (radius * innerRadiusPercentage) / 100
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius)

    const pieData = pie(data)

    svg
      .selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorScale(d.data[categoryField]))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
  }

  const appendChartTitle = (svgContainer, width, margin, titleSize, title) => {
    svgContainer
      .append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', titleSize + 'px')
      .text(title)
  }

  return <div className="chart-container" ref={chartRef}></div>
}

PieChart.propTypes = {
  specs: PropTypes.shape({
    chart: PropTypes.shape({
      title: PropTypes.string,
      titleSize: PropTypes.string,
      showLegend: PropTypes.bool,
      innerRadius: PropTypes.string,
    }).isRequired,
  }).isRequired,
  originalData: PropTypes.object.isRequired,
  chartRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
}

export default React.memo(PieChart)
