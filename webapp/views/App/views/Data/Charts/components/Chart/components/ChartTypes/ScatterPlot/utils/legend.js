export const createLegend = (svg, width, colorScale, data) => {
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
