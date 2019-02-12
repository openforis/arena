import * as d3 from 'd3'
import NodeDef from '../../../../common/survey/nodeDef'

const nodeRadiusInit = 1e-6
const nodeRadius = 10
const nodeLabelDist = nodeRadius + 3

export const init = (treeElement, treeData, lang, onEntityClick) => {

  // Set the dimensions and margins of the diagram
  const margin = { top: 40, right: 100, bottom: 40, left: 100 }
  const width = treeElement.clientWidth - margin.left - margin.right
  const height = treeElement.clientHeight - margin.top - margin.bottom

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3.select(treeElement)
    .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  const duration = 500

  // declares a tree layout and assigns the size
  const treemap = d3.tree().size([height, width])

  // Assigns parent, children, height, depth
  const root = d3.hierarchy(treeData, d => d.children)
  root.x0 = height / 2
  root.y0 = 0

  const collapse = d => {
    if (d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }
  // Collapse after the second level
  root.children.forEach(collapse)

  // Collapse the node and all it's children
  const update = source => {
    // Assigns the x and y position for the nodes
    const treeData = treemap(root)

    // Compute the new tree layout
    const nodes = treeData.descendants()

    const links = treeData.descendants().slice(1)

    // Normalize for fixed-depth
    nodes.forEach(d => { d.y = d.depth * 180 })

    // ****************** Nodes section ***************************

    // Update the nodes...
    const node = svg.selectAll('g.node')
      .data(nodes)

    // Toggle children on click
    const expandNode = d => {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }

      update(d)
    }

    // Enter any new modes at the parent's previous position
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + source.y0 + ',' + source.x0 + ')')

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', nodeRadiusInit)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')

      .on('click', expandNode)
      .on('mouseover', (d, i, nodes) => d3.select(nodes[i]).attr('background-color', 'rgba(222, 220, 203, 0.25)'))

    // Add labels for the nodes
    nodeEnter.append('a')
    // .attr('x', d => -18)

      .on('mouseover', (d, i, nodes) => d3.select(nodes[i]).attr('background-color', 'rgba(222, 220, 203, 0.25)'))
      .append('text')
      .attr('dy', '.35rem')
      .attr('x', d => d.children ? -(nodeLabelDist) : (nodeLabelDist))
      .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
      // .attr('text-anchor', d => 'end')
      .text(d => NodeDef.getNodeDefLabel(d.data, lang))

      .on('click', d => onEntityClick(d.data.uuid))

    // const paddingLeftRight = 18 // adjust the padding values depending on font and font size
    // const paddingTopBottom = 5

    // nodeEnter.append('rect')

    // svg.selectAll('rect')
    //   .attr('x', d => d.x - d.bb.width / 2 - paddingLeftRight / 2)
    //   .attr('y', d => d.y - d.bb.height + paddingTopBottom / 2)
    //   .attr('width', d => d.bb.width + paddingLeftRight)
    //   .attr('height', d => d.bb.height + paddingTopBottom)

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node)

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr('transform', d => 'translate(' + d.y + ',' + d.x + ')')

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', nodeRadius)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
      .attr('cursor', 'pointer')

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
      .duration(duration)
      .attr('transform', d => 'translate(' + source.y + ',' + source.x + ')')
      .remove()

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', nodeRadiusInit)

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', nodeRadiusInit)

    // ****************** links section ***************************

    // Update the links...
    const link = svg.selectAll('path.link')
      .data(links, d => d.id)

    // Creates a curved (diagonal) path from parent to the child nodes
    const diagonal = (s, d) =>
      `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
          ${(s.y + d.y) / 2} ${d.x},
          ${d.y} ${d.x}`

    // Enter any new links at the parent's previous position
    const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', d => {
        const o = { x: source.x0, y: source.y0 }
        return diagonal(o, o)
      })

    // UPDATE
    const linkUpdate = linkEnter.merge(link)

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr('d', d => diagonal(d, d.parent))

    // Remove any exiting links
    link.exit().transition()
      .duration(duration)
      .attr('d', d => {
        const o = { x: source.x, y: source.y }
        return diagonal(o, o)
      })
      .remove()

    // Store the old positions for transition
    nodes.forEach(d => {
      d.x0 = d.x
      d.y0 = d.y
    })
  }

  update(root)
}