import * as d3 from 'd3'

import * as NodeDef from '@core/survey/nodeDef'

import { elementOffset } from '@webapp/utils/domUtils'

const svgMargin = { top: 40, right: 100, bottom: 40, left: 0 }

const treeNodeWidth = 80
const treeNodeHeight = 10
const nodeWidth = 150
const nodeHeight = 80
const nodeLabelDist = 19
const nodeLinkLength = 230

const transitionDuration = 750
const easeEnter = d3.easeExpOut
const easeExit = d3.easeExpOut

export default class Tree {
  constructor({ domElement, data, lang, i18n, onEntityClick }) {
    this.nodesByUuidMap = {}
    this._lang = lang
    this.i18n = i18n
    this.data = data
    this.domElement = domElement
    this.onEntityClick = (nodeDefUuid) => {
      onEntityClick(nodeDefUuid)
      this.expandToNode(nodeDefUuid)
    }

    this.svg = null
    this.tree = null
    this.root = null

    this.rootG = null
    this.resizeObserver = null
    this._nodeDefLabelType = NodeDef.NodeDefLabelTypes.label

    this.initSvg()
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
      node.children.forEach((childNode) => {
        this.initNode(childNode)

        if (collapseChildren) {
          this.collapseNode(childNode)
        }
      })
    }
  }

  resizeObserverCallback() {
    const svgEl = document.querySelectorAll('.survey-hierarchy__svg')[0]
    if (!svgEl) return
    const treeEl = document.querySelectorAll('.survey-hierarchy__tree')[0]
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

  initSvg() {
    // Set the dimensions and margins of the diagram
    const width = this.domElement.clientWidth - svgMargin.left - svgMargin.right
    const height = this.domElement.clientHeight - svgMargin.top - svgMargin.bottom

    // Append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3
      .select(this.domElement)
      .append('svg')
      .classed('survey-hierarchy__svg', true)
      .attr('width', width + svgMargin.right + svgMargin.left)
      .attr('height', height + svgMargin.top + svgMargin.bottom)
      .append('g')
      .attr('id', 'survey-hierarchy__root-g')

    this.rootG = document.querySelector('#survey-hierarchy__root-g')

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

    this.initNode(this.root, true)

    // Collapse the node and all it's children
    this.update(this.root)
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

  disconnect() {
    this.resizeObserver.disconnect()
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
      .attr('class', 'node')
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
      .attr('class', (d) => `node-grid${NodeDef.isVirtual(d.data) ? ' node-virtual' : ''}`)
      .on('click', (_, d) => this.onEntityClick(d.data.uuid))

    // node label element
    nodeGrid
      .append('xhtml:span')
      .attr('class', 'node-label')
      // label
      .text((d) => NodeDef.getLabelWithType({ nodeDef: d.data, lang: this.lang, type: this.nodeDefLabelType }))
      // tooltip
      .attr('title', (d) => NodeDef.getDescription(this.lang)(d.data))

    // node expand/collapse button
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

    // Creates a curved (diagonal) path from parent to the child nodes
    const diagonal = (s, d) =>
      `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2 + nodeWidth / 2} ${s.x},
          ${(s.y + d.y) / 2 + nodeWidth / 2} ${d.x},
          ${d.y + nodeWidth} ${d.x}`

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
      .attr('d', (d) => diagonal(d, d.parent))

    // Remove any exiting links
    link
      .exit()
      .transition()
      .duration(transitionDuration)
      .ease(easeExit)
      .attr('d', () => {
        const o = { x: node.x, y: node.y }
        return diagonal(o, o)
      })
      .style('opacity', 0)
      .remove()
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

    this.svg
      // Remove higlight class for all node-grid elements
      .selectAll('.node-grid')
      .classed('highlight', false)
      // Add 'higlight' class to the selected node-grid element
      .filter((d) => d.data.uuid === uuid)
      .classed('highlight', true)
  }

  _updateLabels() {
    this.svg
      .selectAll('.node-label')
      // label
      .text((d) => NodeDef.getLabelWithType({ nodeDef: d.data, lang: this.lang, type: this.nodeDefLabelType }))
      // tooltip
      .attr('title', (d) => NodeDef.getDescription(this.lang)(d.data))
  }

  get nodeDefLabelType() {
    return this._nodeDefLabelType
  }

  set nodeDefLabelType(nodeDefLabelType) {
    this._nodeDefLabelType = nodeDefLabelType
    this._updateLabels()
  }

  get lang() {
    return this._lang
  }

  set lang(lang) {
    this._lang = lang
    this._updateLabels()
  }
}
