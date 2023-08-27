import * as d3 from 'd3'

export const renderTooltip = (chartRef) => {
  return d3
    .select(chartRef.current)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('pointer-events', 'none')
}

export const renderTitle = (svg, width, title, titleSize) => {
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', `${titleSize}px`)
    .text(title)
}

export const renderLegend = (svg, metrics, colorScale, width) => {
  const legend = svg
    .selectAll('.legend')
    .data(metrics)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => `translate(0,${i * 20})`)

  legend
    .append('rect')
    .attr('x', width - 10)
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', (d) => colorScale(d)) // Use the metric name to get the color

  legend
    .append('text')
    .attr('x', width + 5)
    .attr('y', 6)
    .attr('dy', '.35em')
    .style('text-anchor', 'start')
    .text((d) => d) // use the metric name directly for the text
}

export const renderAxes = (
  svg,
  xScale,
  yScale,
  width,
  height,
  xAxisTitle,
  yAxisTitle,
  axisSize,
  ticksSize,
  isHorizontal
) => {
  const bottomAxis = isHorizontal ? d3.axisLeft(xScale) : d3.axisBottom(xScale)
  const leftAxis = isHorizontal ? d3.axisBottom(yScale) : d3.axisLeft(yScale)
  if (isHorizontal) {
    // X Axis
    svg
      .append('g')
      .attr('transform', `translate(0,0)`) // Move to the top of the SVG
      .call(d3.axisTop(xScale))
      .selectAll('.tick text')
      .style('font-size', `${ticksSize}px`)

    // Y Axis
    svg.append('g').call(d3.axisLeft(yScale)).selectAll('.tick text').style('font-size', `${ticksSize}px`)

    // Swap xAxisTitle and yAxisTitle
    ;[xAxisTitle, yAxisTitle] = [yAxisTitle, xAxisTitle]
  } else {
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(bottomAxis)
      .selectAll('.tick text')
      .style('font-size', `${ticksSize}px`)

    svg.append('g').call(leftAxis).selectAll('.tick text').style('font-size', `${ticksSize}px`)
  }

  // For x-axis title:
  svg
    .append('text')
    .attr('transform', `translate(${width / 2},${height + 40})`)
    .style('text-anchor', 'middle')
    .style('font-size', `${axisSize}px`)
    .text(xAxisTitle)
    .attr('dy', '0.35em') // Adjust position based on font size

  // For y-axis title:
  svg
    .append('text')
    .attr('transform', `rotate(-90)`)
    .attr('y', -80)
    .attr('x', -(height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', `${axisSize}px`)
    .text(yAxisTitle)
    .attr('dy', '0.35em') // Adjust position based on font size

  svg.selectAll('.tick text').style('font-size', `${ticksSize}px`)
}

export const renderStackedBars = (
  svg,
  data,
  metricAggregationNames,
  xScale,
  yScale,
  colorScale,
  height,
  tooltip,
  isHorizontal
) => {
  // Use D3's stack function to compute position of each metric
  const stack = d3.stack().keys(metricAggregationNames)
  const stackedData = stack(data)

  // Create groups for each series
  const bars = svg
    .selectAll('g.metric')
    .data(stackedData)
    .enter()
    .append('g')
    .attr('fill', (d, i) => colorScale(d.key))
    .attr('class', 'metric')

  // Create the bars within each group
  bars
    .selectAll('rect')
    .data((d) => d)
    .enter()
    .append('rect')
    .attr('x', (d) => (isHorizontal ? yScale(d[0]) : xScale(d.data.groupBy)))
    .attr('y', (d) =>
      isHorizontal
        ? xScale(d.data.groupBy) + xScale.bandwidth() - (xScale.bandwidth() - yScale(d[1]) + yScale(d[0]))
        : yScale(d[1])
    ) // Adjust y position in horizontal mode
    .attr('width', (d) => (isHorizontal ? yScale(d[1]) - yScale(d[0]) : xScale.bandwidth()))
    .attr('height', (d) =>
      isHorizontal ? xScale.bandwidth() - (yScale(d[1]) - yScale(d[0])) : yScale(d[0]) - yScale(d[1])
    )
    .on('mouseover', function (event, d) {
      const metricName = d3.select(this.parentNode).datum().key
      const metricValue = d[1] - d[0]
      tooltip.transition().duration(200).style('opacity', 0.9)

      const pos = isHorizontal ? [event.pageY, event.pageX] : [event.pageX, event.pageY]
      tooltip
        .html(`Group: ${d.data.groupBy} <br/> Metric: ${metricName} <br/> Value: ${metricValue}`)
        .style('left', pos[0] + 10 + 'px')
        .style('top', pos[1] - 10 + 'px')
      tooltip
        .html(`Group: ${d.data.groupBy} <br/> Metric: ${metricName} <br/> Value: ${metricValue}`)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 10 + 'px')
    })
    .on('mouseout', function () {
      tooltip.transition().duration(500).style('opacity', 0)
    })
}

export const renderSingleMetricBars = (
  svg,
  data,
  metricAggregationNames,
  xScale,
  yScale,
  colorScale,
  height,
  tooltip,
  isHorizontal
) => {
  svg
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', isHorizontal ? 0 : (d) => xScale(d.groupBy))
    .attr('y', isHorizontal ? (d) => xScale(d.groupBy) : (d) => yScale(d[metricAggregationNames[0]]))
    .attr('width', isHorizontal ? (d) => yScale(d[metricAggregationNames[0]]) : xScale.bandwidth())
    .attr('height', isHorizontal ? xScale.bandwidth() : (d) => height - yScale(d[metricAggregationNames[0]]))
    .attr('fill', (d, i) => colorScale(i))
    .on('mouseover', function (event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip
        .html(`Group: ${d.groupBy} <br/> Value: ${d[metricAggregationNames[0]]}`)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 10 + 'px')
    })
    .on('mouseout', function () {
      tooltip.transition().duration(500).style('opacity', 0)
    })
}

export const renderGroupedBars = (
  svg,
  data,
  metricAggregationNames,
  xScale,
  yScale,
  colorScale,
  height,
  tooltip,
  isHorizontal
) => {
  const xSubgroupScale = d3.scaleBand().domain(metricAggregationNames).range([0, xScale.bandwidth()]).padding(0.05)
  const metricGroups = svg
    .selectAll('.metricGroups')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'metricGroups')
    .attr('transform', (d) => `translate(${xScale(d.groupBy)},0)`)

  metricGroups
    .selectAll('rect')
    .data((d) => metricAggregationNames.map((metric) => ({ key: metric, value: d[metric], groupBy: d.groupBy })))
    .enter()
    .append('rect')
    .attr('x', isHorizontal ? (d) => yScale(d.value) : (d) => xSubgroupScale(d.key))
    .attr('y', isHorizontal ? (d) => xSubgroupScale(d.key) : (d) => yScale(d.value))
    .attr('width', isHorizontal ? (d) => height - yScale(d.value) : xSubgroupScale.bandwidth())
    .attr('height', isHorizontal ? xSubgroupScale.bandwidth() : (d) => height - yScale(d.value))
    .attr('fill', (d) => colorScale(d.key))
    .on('mouseover', function (event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip
        .html(`Group: ${d.groupBy} <br/> Metric: ${d.key} <br/> Value: ${d.value}`)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 10 + 'px')
    })
    .on('mouseout', function () {
      tooltip.transition().duration(500).style('opacity', 0)
    })
}
