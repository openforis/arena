import '../react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { getNodeDefChildren } from '../../../../../common/survey/survey'
import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,

  nodeDefRenderType,
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { getSurvey } from '../../../surveyState'

import { fetchNodeDefChildren, putNodeDefProp, } from '../../actions'

class NodeDefEntityTable extends React.Component {

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
    const {children} = this.props
    return children.length > 0
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
      children,

      // form
      edit,
      draft,
      render,

      // edit mode
      locked,

      // data entry
      entry,
      parentNode,
      node,
    } = this.props

    const innerPageChildren = filterInnerPageChildren(children)


    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: '20px 1fr',
      }}>
        <div className="form-label" style={{justifySelf: 'center'}}>{nodeDef.props.name}</div>
        <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              autoSize={false}
                              rowHeight={edit ? 80 : 60}
                              cols={{
                                lg: innerPageChildren.length || 1,
                                md: innerPageChildren.length || 1,
                                sm: innerPageChildren.length || 1,
                                xs: 1,
                                xxs: 1
                              }}
                              containerPadding={edit ? [0, 30] : [0, 0]}
          // layouts={{}}
          //                     onLayoutChange={this.onLayoutChange}
          //                     isDraggable={edit && !locked}
                              isDraggable={false}
                              isResizable={false}
                              compactType={'horizontal'}
                              margin={[0, 0]}>
          {
            innerPageChildren
              .map((childDef, i) =>
                <div key={childDef.uuid} data-grid={{
                  i: nodeDef.uuid, x: i, y: 0, w: 1, h: 1,
                }}>
                  <NodeDefSwitch key={i}
                                 nodeDef={childDef}
                                 edit={edit}
                                 draft={draft}
                                 render={render}
                                 parentNode={node}
                                 renderType={nodeDefRenderType.tableHeader}/>
                </div>
              )
          }


        </ResponsiveGridLayout>
      </div>
    )
  }
}

export default NodeDefEntityTable