import * as d3 from 'd3'

import NodeDef from '../../../../common/survey/nodeDef'

const svgMargin = { top: 40, right: 100, bottom: 40, left: 100 }

const nodeRadiusInit = 1e-6
const nodeRadius = 10
const nodeLabelDist = nodeRadius + 3
const nodeLinkLength = 200

const transitionDuration = 500

export default class SurveyHierarchyTree {

  constructor (domElement, data, lang, onEntityClick) {
    this.nodesByUuidMap = {}
    this.lang = lang
    this.data = data
    this.domElement = domElement
    this.onEntityClick = onEntityClick

    this.svg = null
    this.tree = null
    this.root = null

    this.initSvg()
  }

  collapseNode (node) {
    if (node.children) {
      node._children = node.children
      node._children.forEach((child) => this.collapseNode(child))
      node.children = null
    }
  }

  toggleNode (node) {
    if (node.children) {
      this.collapseNode(node)
    } else {
      node.children = node._children
      node._children = null
    }

    this.update(node)
  }

  initNode (node, collapseChildren = false) {
    this.nodesByUuidMap[node.data.uuid] = node

    if (node.children) {
      node.children.forEach(childNode => {
        this.initNode(childNode)

        if (collapseChildren) {
          this.collapseNode(childNode)
        }
      })

    }
  }

  initSvg () {
    // Set the dimensions and margins of the diagram

    const width = this.domElement.clientWidth - svgMargin.left - svgMargin.right
    const height = this.domElement.clientHeight - svgMargin.top - svgMargin.bottom

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select(this.domElement)
      .append('svg')
      .attr('width', width + svgMargin.right + svgMargin.left)
      .attr('height', height + svgMargin.top + svgMargin.bottom)
      .append('g')
      .attr('transform', `translate(${svgMargin.left}, ${svgMargin.top})`)

    // declares a tree layout and assigns the size
    this.tree = d3.tree().size([height, width])

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(this.data, d => d.children)
    this.root.x0 = height / 2
    this.root.y0 = 0

    this.initNode(this.root, true)

    // Collapse the node and all it's children
    this.update(this.root)
  }

  update (node) {
    const treeData = this.tree(this.root)

    const nodes = this.updateNodes(treeData, node)

    this.updateLinks(treeData, node)

    // Store the old positions for transition
    nodes.forEach(d => {
      d.x0 = d.x
      d.y0 = d.y
    })
  }

  updateNodes (treeData, source) {

    // Compute the new tree layout
    const nodes = treeData.descendants()
    // Normalize for fixed-depth
    nodes.forEach(d => d.y = d.depth * nodeLinkLength)

    const node = this.svg.selectAll('g.node')
      .data(nodes)

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
      .on('click', this.toggleNode.bind(this))

    // Add labels for the nodes
    nodeEnter.append('text')
      .on('click', d => this.onEntityClick(d.data.uuid))
      .attr('alignment-baseline', 'middle')
      .attr('x', d => d.children || d._children ? -(nodeLabelDist) : (nodeLabelDist))
      .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
      .text(d => NodeDef.getNodeDefLabel(d.data, this.lang))

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node)

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(transitionDuration)
      .attr('transform', d => `translate(${d.y}, ${d.x})`)

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', nodeRadius)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
      .attr('cursor', 'pointer')

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
      .duration(transitionDuration)
      .attr('transform', d => `translate(${source.y}, ${source.x})`)
      .remove()

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', nodeRadiusInit)

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', nodeRadiusInit)

    return nodes
  }

  updateLinks (treeData, node) {
    const links = treeData.descendants().slice(1)

    // Update the links...
    const link = this.svg.selectAll('path.link')
      .data(links, d => d.data.uuid)

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
        const o = { x: node.x0, y: node.y0 }
        return diagonal(o, o)
      })

    // UPDATE
    const linkUpdate = linkEnter.merge(link)

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(transitionDuration)
      .attr('d', d => diagonal(d, d.parent))

    // Remove any exiting links
    link.exit().transition()
      .duration(transitionDuration)
      .attr('d', d => {
        const o = { x: node.x, y: node.y }
        return diagonal(o, o)
      })
      .remove()
  }

  expandToNode (uuid) {
    let currentUuid = uuid
    while (this.nodesByUuidMap[currentUuid].parent) {
      const n = this.nodesByUuidMap[currentUuid].parent

      if (n._children) {
        n.children = n._children
        n._children = null
      }
      currentUuid = n.data.uuid
    }

    this.update(this.root)

    const selectedCircle = this.svg.selectAll('circle')
      .filter(d => d.data.uuid === uuid)

    selectedCircle.style('stroke', 'rgba(255, 0, 0, 0)')
      .style('stroke-width', 3)
      .transition()
      .duration(transitionDuration)
      .style('stroke', 'rgba(255, 0, 0, 1)')
      .transition()
      .duration(1500)
      .style('stroke', 'rgba(255, 0, 0, 0)')
  }

}