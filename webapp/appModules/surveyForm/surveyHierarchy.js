import './surveyHierarchy.scss'

import * as R from 'ramda'
import * as d3 from 'd3'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'

import * as SurveyState from '../../survey/surveyState'
import * as NodeDefUiProps from '../surveyForm/nodeDefs/nodeDefSystemProps'

import { initSurveyDefs } from '../../survey/actions'


class Variables extends React.Component {
  render () {
    const {
      childDefs, lang,
      // filterTypes,
    } = this.props

    // const filtered = nodeDef => NodeDef.isNodeDefAttribute(nodeDef) &&
    //   (R.isEmpty(filterTypes) || R.includes(NodeDef.getType(nodeDef), filterTypes))

    // console.log(childDefs) // DEBUG
    return childDefs && (
      childDefs.map(
        childDef => {
          const childDefUuid = NodeDef.getUuid(childDef)

          return <button key={childDefUuid}>
            {NodeDef.getNodeDefLabel(childDef, lang)}
            {NodeDefUiProps.getNodeDefIconByType(NodeDef.getType(childDef))}
          </button>
        }
      )
    )
  }
}

Variables.defaultProps = {
  nodeDefUuid: null,
  lang: null,
}

const mapStateToProps_ = (state, props) => {
  const { nodeDefUuid } = props
  const survey = SurveyState.getSurvey(state)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const childDefs = nodeDefUuid
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  return {
    nodeDefParent,
    childDefs,
  }
}
const VariablesConnect = connect(mapStateToProps_)(Variables)

class SurveyHierarchy extends React.Component {
  constructor () {
    super()

    this.state = { nodeDefUuid: null }
  }

  componentDidMount () {
    const { initSurveyDefs } = this.props

    initSurveyDefs(true, true) // TODO
    this.initTree()
  }

  componentDidUpdate (prevProps) {
    const { treeData: prevTreeData } = prevProps

    if (!R.equals(prevTreeData, this.props.treeData)) {
      this.initTree()
    }
  }

  render () {
    return (
      <div id="hierarchy">
        <div id="tree"/>
        <div className="variables__container">
          <VariablesConnect nodeDefUuid={this.state.nodeDefUuid} lang={this.state.lang} />
        </div>
      </div>
    )
  }
  // nodeDefVariableUuids={nodeDefVariableUuids}
  // toggleNodeDefVariable={this.toggleNodeDefVariable.bind(this)}
  // filterTypes={filterTypes} />

  initTree () {
    const { treeData, lang } = this.props

    d3.select('svg').remove()

    if (!treeData.id) return

    // Set the dimensions and margins of the diagram
    const margin = { top: 20, right: 90, bottom: 30, left: 90 }
    const width = document.getElementById('tree').clientWidth - margin.left - margin.right
    const height = document.getElementById('tree').clientHeight - margin.top - margin.bottom

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3.select('#tree').append('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    let i = 0

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
        .data(nodes, d => d.id || (d.id = ++i))

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
        .attr('r', 1e-6)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
        .on('click', expandNode)

      // Add labels for the nodes
      nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        // .attr('x', d => -18)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        // .attr('text-anchor', d => 'end')
        .text(d => NodeDef.getNodeDefLabel(d.data, lang))
        .on('click', d => this.setState({ nodeDefUuid: d.data.uuid }))


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
        .attr('r', 10)
        .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
        .attr('cursor', 'pointer')


      // Remove any exiting nodes
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', d => 'translate(' + source.y + ',' + source.x + ')')
        .remove()

      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr('r', 1e-6)

      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6)

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
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const treeData = Survey.getHierarchy()(survey).root
  const lang = Survey.getDefaultLanguage(survey)

  // const treeData = (function buildTree (nodeDef, lang) {
  //   console.log('nodeDef', nodeDef)
  //   return nodeDef.id && { // TODO
  //     name: NodeDef.getNodeDefLabel(nodeDef, lang),
  //     children: nodeDef.children && nodeDef.children.map(childNode => buildTree(childNode))
  //   }
  // })(root, Survey.getDefaultLanguage(survey))

  return {
    treeData,
    lang,
  }
}

export default connect(
  mapStateToProps,
  { initSurveyDefs }
)(SurveyHierarchy)