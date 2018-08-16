import '../react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,

  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'

import { getNodeDefChildren, getSurveyState } from '../../../surveyState'

import { fetchNodeDefChildren, putNodeDefProp, } from '../../actions'

class NodeDefEntity extends React.Component {

  constructor () {
    super()
    this.onLayoutChange = this.onLayoutChange.bind(this)
  }

  componentDidMount () {
    const {nodeDef, fetchNodeDefChildren, draft} = this.props

    if (nodeDef.id)
      this.fetchChildren()
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDef} = this.props
    const prevNodeDefId = R.path(['nodeDef', 'id'], prevProps)

    if (nodeDef.id !== prevNodeDefId)
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
    const columns = getNoColumns(nodeDef)
    const rdgLayout = getLayout(nodeDef)

    const innerPageChildren = filterInnerPageChildren(children)

    const l = [
      {w: 1, h: 1, x: 0, y: 0, i: '24739212-9fe4-4521-941c-d84ca83b16f9', moved: false, static: false},
      {w: 1, h: 1, x: 1, y: 0, i: '2b031ea5-b286-45c7-8e11-df6baf7629c1', moved: false, static: false},
      {w: 1, h: 1, x: 2, y: 0, i: '647a635d-6357-4e78-96a7-8cf1f13b8f47', moved: false, static: false},
    ]

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
                  <NodeDefSwitch key={i} nodeDef={childDef} edit={edit} draft={draft} render={render}
                    entry={entry} parentNode={node} />
                </div>
              )
          }

        </ResponsiveGridLayout>
        //TODO Render table

        : isRenderTable(nodeDef) ?
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
                                   parentNode={node} />
                  </div>
                )
            }


          </ResponsiveGridLayout>
        </div>
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
  children: getNodeDefChildren(props.nodeDef)(getSurveyState(state)),
})

export default connect(mapStateToProps, {putNodeDefProp, fetchNodeDefChildren})(NodeDefEntity)