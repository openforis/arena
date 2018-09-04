import '../react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'
import NodeDefEntityTable from './nodeDefEntityTable'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { getNodeDefChildren } from '../../../../../common/survey/survey'
import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,

  isRenderForm,
  isRenderTable,
  nodeDefRenderType,
} from '../../../../../common/survey/nodeDefLayout'

import { fetchNodeDefChildren, putNodeDefProp, } from '../../actions'

class NodeDefEntity extends React.Component {

  constructor () {
    super()
    this.onLayoutChange = this.onLayoutChange.bind(this)
  }

  componentDidMount () {
    const {nodeDef} = this.props

    if (nodeDef.id)
      this.fetchChildren()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDef} = this.props
    const {id: nodeDefId} = nodeDef
    const prevNodeDefId = R.path(['nodeDef', 'id'], prevProps)

    if (nodeDefId && nodeDefId !== prevNodeDefId)
      this.fetchChildren()
  }

  fetchChildren () {
    const {nodeDef, fetchNodeDefChildren, draft, edit} = this.props
    fetchNodeDefChildren(nodeDef.id, draft, edit)
  }

  hasChildren () {
    const {childDefs} = this.props
    return childDefs.length > 0
  }

  onLayoutChange (layout) {
    const {nodeDef, edit, locked, putNodeDefProp} = this.props

//console.log(window.innerWidth) ||
    edit && !locked && window.innerWidth > 1200 && layout.length > 0
      ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
      : null
  }

  render () {
    const {
      nodeDef,
      childDefs,

      // form
      edit,
      draft,
      render,

      // edit mode
      locked,

      // data entry
      entry,
      parentNode,
      nodes,
    } = this.props
    const columns = getNoColumns(nodeDef)
    const rdgLayout = getLayout(nodeDef)

    const node = entry ? nodes[0] : null

    const innerPageChildren = filterInnerPageChildren(childDefs)

    return (
      isRenderForm(nodeDef) && this.hasChildren() ?
        <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              autoSize={false}
                              rowHeight={edit ? 80 : 60}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              containerPadding={edit ? [20, 50] : [20, 20]}
                              layouts={{
                                lg: rdgLayout,
                                md: rdgLayout,
                                sm: rdgLayout,
                              }}
                              onLayoutChange={this.onLayoutChange}
                              isDraggable={edit && !locked}
                              isResizable={edit && !locked}
          //TODO decide if verticalCompact
                              compactType={'vertical'}>

          {
            innerPageChildren
              .map((childDef, i) =>
                <div key={childDef.uuid}>
                  <NodeDefSwitch key={i}
                                 {...this.props}
                                 nodeDef={childDef}
                                 parentNode={node}/>
                </div>
              )
          }

        </ResponsiveGridLayout>

        : isRenderTable(nodeDef) ? <NodeDefEntityTable {...this.props} />
        : null
    )
  }
}

NodeDefEntity.defaultProps = {
  entityDef: {},
  draft: false,
  edit: false,
}

const mapStateToProps = (state, props) => ({
  childDefs: getNodeDefChildren(props.nodeDef)(props.survey),
})

export default connect(mapStateToProps, {putNodeDefProp, fetchNodeDefChildren})(NodeDefEntity)