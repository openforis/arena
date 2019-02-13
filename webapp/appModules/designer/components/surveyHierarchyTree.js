import * as d3 from 'd3'
import NodeDef from '../../../../common/survey/nodeDef'

const nodeRadiusInit = 1e-6
const nodeRadius = 10
const nodeLabelDist = nodeRadius + 3
const duration = 500

export default class SurveyHierarchyTree {
  constructor (treeElement, treeData, lang, onEntityClick) {
    this.uuidNode = {}
    this.lang = lang

    this.onEntityClick = onEntityClick
    this.i = 0

    // Set the dimensions and margins of the diagram
    const margin = { top: 40, right: 100, bottom: 40, left: 100 }
    const width = treeElement.clientWidth - margin.left - margin.right
    const height = treeElement.clientHeight - margin.top - margin.bottom

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select(treeElement)
      .append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([height, width])

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(treeData, d => d.children)
    this.root.x0 = height / 2
    this.root.y0 = 0

    // build the uuidNode map
    const flattenNodes = n => {
      this.uuidNode[n.data.uuid] = n
      if (n.children) n.children.forEach(c => flattenNodes(c))
    }
    flattenNodes(this.root)

    const collapse = d => {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }
    // Collapse after the second level
    this.root.children.forEach(collapse)

    // Collapse the node and all it's children
    this.update(this.root)
  }

  expandToNode (uuid) {
    let currentUuid = uuid
    while (this.uuidNode[currentUuid].parent) {
      const n = this.uuidNode[currentUuid].parent

      if (n._children) {
        n.children = n._children
        n._children = null
      }
      currentUuid = n.data.uuid
    }

    this.update(this.root)

    const c = this.svg.selectAll('circle').filter(d => d.data.uuid === uuid)
    c.style('stroke', 'rgba(255, 0, 0, 0)')
      .style('stroke-width', 3)
      .transition()
      .duration(duration)
      .style('stroke', 'rgba(255, 0, 0, 1)')
      .transition()
      .duration(1500)
      .style('stroke', 'rgba(255, 0, 0, 0)')
  }

  update (source) {
    // Assigns the x and y position for the nodes
    const treeData = this.treemap(this.root)

    // Compute the new tree layout
    const nodes = treeData.descendants()

    const links = treeData.descendants().slice(1)

    // Normalize for fixed-depth
    nodes.forEach(d => { d.y = d.depth * 180 })

    // ****************** Nodes section ***************************

    // Update the nodes...
    const node = this.svg.selectAll('g.node')
      .data(nodes, d => d.id || (d.id = ++this.i))

    // Toggle children on click
    const expandNode = d => {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }

      this.update(d)
    }

    // Enter any new modes at the parent's previous position
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${source.y0}, ${source.x0})`)

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', nodeRadiusInit)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
      .on('mouseover', (d, i, nodes) => d3.select(nodes[i])
        .style('stroke', 'rgba(222, 220, 203, 1)')
        .style('stroke-width', 3))
      .on('mouseout', (d, i, nodes) => d3.select(nodes[i]).style('stroke', 'none'))
      .on('click', expandNode)

    // Add labels for the nodes
    nodeEnter.append('text')
      .on('click', d => this.onEntityClick(d.data.uuid))
      .attr('alignment-baseline', 'middle')
      .attr('x', d => d.children || d._children ? -(nodeLabelDist) : (nodeLabelDist))
      .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
      .text(d => NodeDef.getNodeDefLabel(d.data, this.lang))
    // .on('mouseover', (d, i, nodes) => d3.select(nodes[i]).append('rect')

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
      .attr('transform', d => `translate(${d.y}, ${d.x})`)

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', nodeRadius)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
      .attr('cursor', 'pointer')

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
      .duration(duration)
      .attr('transform', d => `translate(${source.y}, ${source.x})`)
      .remove()

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', nodeRadiusInit)

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', nodeRadiusInit)

    // ****************** links section ***************************

    // Update the links...
    const link = this.svg.selectAll('path.link')
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
}