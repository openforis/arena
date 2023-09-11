import * as d3 from 'd3'
import {
  renderTooltip,
  renderTitle,
  renderLegend,
  renderAxes,
  renderStackedBars,
  renderSingleMetricBars,
  renderGroupedBars,
} from './renderHelpers'

const setupChart = (data, specs, metricAggregationNames, chartRef) => {
  d3.select(chartRef.current).select('svg').remove()
  const margin = { top: 80, right: 60, bottom: 50, left: 100 }
  const width = chartRef.current.clientWidth - margin.left - margin.right
  const height = chartRef.current.clientHeight - margin.top - margin.bottom

  const isMultiMetric = metricAggregationNames.length > 1
  const isHorizontal = specs.chart.isHorizontal

  const svg = d3
    .select(chartRef.current)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const tooltip = renderTooltip(chartRef)

  const xScale = d3
    .scaleBand()
    .rangeRound([0, width])
    .padding(0.1)
    .domain(data.map((d) => d.groupBy))

  const yScale = d3.scaleLinear().rangeRound([height, 0])

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

  if (isHorizontal) {
    xScale.rangeRound([0, height])
    yScale.rangeRound([width, 0])
  } else {
    xScale.rangeRound([0, width])
    yScale.rangeRound([height, 0])
  }

  return { width, height, svg, tooltip, xScale, yScale, colorScale, isHorizontal, isMultiMetric }
}

const renderBars = (params) => {
  const {
    isMultiMetric,
    specs,
    svg,
    data,
    metricAggregationNames,
    xScale,
    yScale,
    colorScale,
    height,
    tooltip,
    isHorizontal,
  } = params

  if (isMultiMetric) {
    if (specs.chart.stackedBars) {
      renderStackedBars(svg, data, metricAggregationNames, { xScale, yScale }, colorScale, tooltip, isHorizontal)
    } else {
      renderGroupedBars(svg, data, {
        metricAggregationNames,
        xScale,
        yScale,
        colorScale,
        height,
        tooltip,
        isHorizontal,
      })
    }
  } else {
    renderSingleMetricBars(svg, data, metricAggregationNames, {
      xScale,
      yScale,
      colorScale,
      height,
      tooltip,
      isHorizontal,
    })
  }
}

export const renderBarChart = (data, specs, metricAggregationNames, groupByField, chartRef) => {
  const { width, height, svg, tooltip, xScale, yScale, colorScale, isHorizontal, isMultiMetric } = setupChart(
    data,
    specs,
    metricAggregationNames,
    chartRef
  )

  const maxMetricValue = d3.max(data, (d) => d3.max(metricAggregationNames, (metric) => d[metric]))
  const barMaxHeight = specs.chart.barMaxHeight ? parseInt(specs.chart.barMaxHeight, 10) : null
  if (barMaxHeight) {
    yScale.domain([0, Math.min(maxMetricValue, barMaxHeight)])
  } else {
    yScale.domain([0, maxMetricValue])
  }

  let xAxisTitle = specs.chart.xAxisTitle || groupByField
  let yAxisTitle = specs.chart.yAxisTitle || metricAggregationNames[0]
  if (isHorizontal) {
    ;[xAxisTitle, yAxisTitle] = [yAxisTitle, xAxisTitle]
  }

  renderAxes(
    svg,
    { xScale, yScale },
    { width, height },
    { xAxisTitle, yAxisTitle },
    { axisSize: specs.chart.axisSize || 14, ticksSize: specs.chart.ticksSize || 12 },
    isHorizontal
  )

  renderBars({
    isMultiMetric,
    specs,
    svg,
    data,
    metricAggregationNames,
    xScale,
    yScale,
    colorScale,
    height,
    tooltip,
    isHorizontal,
  })

  if (specs.chart.showTitle) {
    renderTitle(svg, width, specs.chart.title, specs.chart.titleSize || 16)
  }

  if (isMultiMetric && specs.chart.showLegend) {
    renderLegend(svg, metricAggregationNames, colorScale, width)
  }
}
