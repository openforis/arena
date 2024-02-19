const buildTooltip = ({ d3ContainerSelection, backgroundColor = 'white', color = 'black' }) => {
  let tooltip = d3ContainerSelection.select('.tooltip')
  if (tooltip.empty()) {
    tooltip = d3ContainerSelection
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('padding', '5px')
      .style('border-radius', '5px')
      .style('opacity', 0)
      .style('border', '1px solid #000')
      .style('background-color', backgroundColor)
      .style('color', color)
  }
  return tooltip
}

const showTooltip = ({ tooltip, event }) => {
  tooltip.transition().duration(100).style('opacity', 0.9)
  tooltip.style('left', event.layerX + 20 + 'px').style('top', event.layerY - 28 + 'px')
}

const hideTooltip = ({ tooltip }) =>
  tooltip
    .transition()
    .duration(200)
    .style('opacity', 0)
    .on('end', function () {
      tooltip.html('')
    })

export const ChartUtils = {
  buildTooltip,
  showTooltip,
  hideTooltip,
}
