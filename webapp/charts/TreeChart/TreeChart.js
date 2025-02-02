import './TreeChart.scss'

import * as d3 from 'd3'

import { elementOffset } from '@webapp/utils/domUtils'
import { Objects } from '@openforis/arena-core'

const svgMargin = { top: 40, right: 100, bottom: 40, left: 0 }

const treeNodeWidth = 80
const treeNodeHeight = 10
const nodeWidth = 150
const nodeHalfWidth = nodeWidth / 2
const nodeHeight = 80
const nodeLabelDist = 19
const nodeLinkLength = 230

const transitionDuration = 750
const easeEnter = d3.easeExpOut
const easeExit = d3.easeExpOut
const extraLinksTransitionDuration = 2000

const diagonal = (s, d, randomOffset = false) => {
  // x and y are reverted
  const middleX = (s.y + d.y) / 2 + nodeWidth / 2
  const offset = randomOffset ? Math.ceil(Math.random() * 10) : 0
  return `M ${s.y} ${s.x}
    C ${middleX} ${s.x},
      ${middleX} ${d.x},
      ${d.y + nodeWidth + offset} ${d.x}`
}

const line = (s, d) => {
  // check why X and Y are reversed
  const { x: sY, y: sX } = s
  const { x: dY, y: dX } = d
  return `M${sX},${sY}
      L${dX + nodeWidth},${dY}`
}

const semiArc = ({ point }) => {
  const path = d3.path()
  const radius = 30
  const { x: y, y: x } = point

  // Draw the semi-arc path
  const startAngle = Math.PI / 5 // 36 degrees
  const endAngle = (7 * Math.PI) / 4 // 315 degrees
  path.arc(x, y, radius, startAngle, endAngle)

  return path.toString()
}

const DEFAULT_OPTIONS = {
  collapsible: true,
  startCollapsed: true,
  parentChild: {
    directLines: true,
  },
}

export default class TreeChart {
  constructor({
    domElement,
    data,
    extraLinksGroups,
    i18n,
    nodeClassFunction,
    nodeFilterFunction,
    nodeLabelFunction,
    nodeTooltipFunction,
    onNodeClick: onNodeClickProp,
    svgClass = 'hierarchy_tree_svg',
    rootNodeElementId = 'hierarchy__root-g',
    wrapperClass = 'hierarchy__tree',
    options = DEFAULT_OPTIONS,
  }) {
    this.domElement = domElement
    this.data = data
    this.extraLinksGroups = extraLinksGroups
    this.i18n = i18n
    this.nodeWrapperClassName = 'node'
    this.nodeClassFunction = nodeClassFunction
    this.nodeFilterFunction = nodeFilterFunction
    this._nodeLabelFunction = nodeLabelFunction
    this._nodeTooltipFunction = nodeTooltipFunction
    this.svgClass = svgClass
    this.rootNodeElementId = rootNodeElementId
    this.wrapperClass = wrapperClass
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.nodesByUuidMap = {}

    this.onNodeClick = (nodeUuid) => {
      onNodeClickProp?.(nodeUuid)
      this.expandToNode(nodeUuid)
    }

    this.svg = null
    this.tree = null
    this.root = null

    this.rootG = null
    this.resizeObserver = null

    this.initSvg()
  }

  initSvg() {
    const { collapsible, startCollapsed } = this.options

    // Set the dimensions and margins of the diagram
    const { domElement } = this
    const width = domElement.clientWidth - svgMargin.left - svgMargin.right
    const height = domElement.clientHeight - svgMargin.top - svgMargin.bottom

    // Append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3
      .select(domElement)
      .append('svg')
      .classed(this.svgClass, true)
      .attr('width', width + svgMargin.right + svgMargin.left)
      .attr('height', height + svgMargin.top + svgMargin.bottom)
      .append('g')
      .attr('id', this.rootNodeElementId)

    this.rootG = document.querySelector(`#${this.rootNodeElementId}`)

    // InitObserver
    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback.bind(this))
    this.resizeObserver.observe(this.rootG)

    // Declares a tree layout and assigns the size
    this.tree = d3
      .tree()
      .size([height, width])
      .nodeSize([treeNodeWidth, treeNodeHeight])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2))

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(this.data, (d) => d.children)
    this.root.x0 = height / 2
    this.root.y0 = 0

    this.initNode(this.root, collapsible && startCollapsed)

    // Collapse the node and all it's children
    this.update(this.root)

    if (this.extraLinksGroups) {
      this.updateExtraLinks()
    }
  }

  destroy() {
    if (this.domElement) {
      const containerSelection = d3.select(this.domElement)
      containerSelection.selectAll('svg').remove()
    }
    this.svg = null
    this.resizeObserver?.disconnect()
  }

  /* eslint-disable no-param-reassign */
  collapseNode(node) {
    if (node.children) {
      node._children = node.children
      node._children.forEach((child) => this.collapseNode(child))
      node.children = null
    }
  }

  /* eslint-disable no-param-reassign */
  toggleNode(node) {
    if (node.children) {
      this.collapseNode(node)
    } else {
      node.children = node._children
      node._children = null
    }
    this.update(node)
  }

  initNode(node, collapseChildren = false) {
    this.nodesByUuidMap[node.data.uuid] = node

    if (node.children) {
      const childrenFiltered = this.nodeFilterFunction ? node.children.filter(this.nodeFilterFunction) : node.children
      childrenFiltered.forEach((childNode) => {
        this.initNode(childNode)
        if (collapseChildren) {
          this.collapseNode(childNode)
        }
      })
    }
  }

  resizeObserverCallback() {
    const svgEl = document.querySelectorAll(`.${this.svgClass}`)[0]
    if (!svgEl) return
    const treeEl = document.querySelectorAll(`.${this.wrapperClass}`)[0]
    const treeElSize = elementOffset(treeEl)

    const bBox = this.rootG.getBBox()
    const oldWidth = Number(svgEl.getAttribute('width'))
    const newWidth = bBox.width
    const newHeight = bBox.height

    svgEl.setAttribute('width', `${newWidth}`)
    svgEl.setAttribute('height', `${Math.max(newHeight, treeElSize.height)}`)

    d3.select(this.rootG).attr('transform', `translate(${svgMargin.left}, ${Math.max(-bBox.y, 19)})`)

    if (newWidth > oldWidth) {
      treeEl.scrollLeft = newWidth
    }
  }

  update(node) {
    const treeData = this.tree(this.root)

    const nodes = this.updateNodes(treeData, node)

    this.updateLinks(treeData, node)

    // Store the old positions for transition

    nodes.forEach(
      /* eslint-disable no-param-reassign */
      (d) => {
        d.x0 = d.x
        d.y0 = d.y
      }
    )
  }

  updateNodes(treeData, source) {
    const nodes = treeData.descendants()

    nodes.forEach((d) => {
      d.y = d.depth * nodeLinkLength
    })

    const node = this.svg.selectAll('g.node').data(nodes, (d) => d.data.uuid)

    // Enter any new nodes at the parent's previous position
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', this.nodeWrapperClassName)
      .attr('transform', () => `translate(${source.y0}, ${source.x0})`)

    const hasChildren = (d) => d.children || d._children

    // Add labels for the nodes
    const fo = nodeEnter
      .append('foreignObject')
      .attr('x', 0)
      .attr('y', -nodeLabelDist)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)

    const nodeGrid = fo
      .append('xhtml:div')
      .attr('class', this.nodeClassFunction)
      .on('click', (_, d) => this.onNodeClick(d.data.uuid))

    // node label element
    nodeGrid
      .append('xhtml:span')
      .attr('class', 'node-label')
      // label
      .text(this.nodeLabelFunction)
      // tooltip
      .attr('title', this.nodeTooltipFunction)

    // node expand/collapse button
    if (this.options.collapsible) {
      nodeGrid
        .append('xhtml:button')
        .attr('class', 'btn')
        .attr('title', () => this.i18n.t('common.expandCollapse'))
        .style('display', (d) => (hasChildren(d) ? 'block' : 'none'))
        .on('click', (event, d) => {
          event.stopPropagation()
          this.toggleNode(d)
        })
        .append('xhtml:span')
        .attr('class', 'icon icon-tree icon-12px')
    }

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node)

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(transitionDuration)
      .ease(easeEnter)
      .attr('transform', (d) => `translate(${d.y}, ${d.x})`)

    // Remove any exiting nodes
    node
      .exit()
      .transition()
      .duration(transitionDuration)
      .ease(easeExit)
      .attr('transform', `translate(${source.y}, ${source.x})`)
      .style('opacity', 0)
      .remove()

    return nodes
  }

  updateLinks(treeData, node) {
    const links = treeData.descendants().slice(1)

    // Update the links...
    const link = this.svg.selectAll('path.link').data(links, (d) => d.data.uuid)

    // Enter any new links at the parent's previous position
    const linkEnter = link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', () => {
        const o = { x: node.x0, y: node.y0 }
        return diagonal(o, o)
      })

    // UPDATE
    const linkUpdate = linkEnter.merge(link)

    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(transitionDuration)
      .ease(easeEnter)
      .attr('d', (d) => (this.options.parentChild.directLines ? line(d, d.parent) : diagonal(d, d.parent)))

    // Remove any exiting links
    link
      .exit()
      .transition()
      .duration(transitionDuration)
      .ease(easeExit)
      .attr('d', () => {
        const { x, y } = node
        const o = { x, y }
        return diagonal(o, o)
      })
      .style('opacity', 0)
      .remove()
  }

  updateExtraLinks() {
    this.addArrowHeadMarker()

    const { nodesByUuidMap } = this

    this.extraLinksGroups.forEach((group) => {
      const { key, links, color } = group

      const linksSelection = this.svg
        .append('g')
        .attr('class', `extra-links-${key}`)
        .selectAll('.extra-link')
        .data(links)

      // draw a line from the bottom (center) of the source node to the top of the target node
      linksSelection
        .enter()
        .insert('path', 'g')
        .attr('class', 'extra-link')
        .attr('d', (d) => {
          const { source, target } = d
          const sourceNode = nodesByUuidMap[source]
          const targetNode = nodesByUuidMap[target]
          if (Objects.isEqual(source, target)) {
            // source == target => draw a semi-arc from the source to the source itself
            return semiArc({ point: sourceNode })
          }
          const { x: sY, y: sX } = sourceNode
          const { x: tY, y: tX } = targetNode
          const isDescendant = tX > sX
          if (isDescendant) {
            const randomHOffset = Math.ceil(Math.random() * nodeHeight * 0.2)
            return `M${sX + nodeWidth},${sY + randomHOffset} L${tX},${tY + randomHOffset}`
          } else {
            const randomXOffset = Math.ceil(Math.random() * nodeWidth * 0.4)
            return `M${sX + nodeHalfWidth},${sY + 10} L${tX + nodeHalfWidth + randomXOffset},${tY - 25}`
          }
        })
        .attr('fill', 'none')
        .style('stroke', color)
        .style('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)')
        // add fade in effect
        .attr('opacity', 0)
        .transition()
        .duration(extraLinksTransitionDuration)
        .attr('opacity', 1)
    })
  }

  addArrowHeadMarker() {
    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('refX', 4)
      .attr('refY', 4)
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 8 4 0 8 4 4')
      .style('fill', 'black')
  }

  expandToNode(uuid) {
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

    const node = this.svg.selectAll('.node-grid').filter((d) => d.data.uuid === uuid)
    const highlightedBefore = node.attr('class').includes('highlight')

    this.svg
      // Remove higlight class for all node-grid elements
      .selectAll('.node-grid')
      .classed('highlight', false)

    node.classed('highlight', !highlightedBefore)
  }

  updateLabels() {
    this.svg
      .selectAll('.node-label')
      // label
      .text(this.nodeLabelFunction)
      // tooltip
      .attr('title', this.nodeTooltipFunction)
  }

  get nodeLabelFunction() {
    return this._nodeLabelFunction
  }

  set nodeLabelFunction(func) {
    this._nodeLabelFunction = func
    this.updateLabels()
  }

  get nodeTooltipFunction() {
    return this._nodeTooltipFunction
  }

  set nodeTooltipFunction(func) {
    this._nodeTooltipFunction = func
    this.updateLabels()
  }
}
