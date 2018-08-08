import './react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from './nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
  isRenderForm,
  isRenderTable,
} from '../../../../common/survey/nodeDefLayout'

import { getNodeDefChildren, getSurveyState } from '../../surveyState'

import { fetchNodeDefChildren, putNodeDefProp, } from '../actions'

class NodeDefEntity extends React.Component {

  componentDidMount () {
    const {nodeDef, fetchNodeDefChildren, draft} = this.props

    if (nodeDef.id)
      fetchNodeDefChildren(nodeDef.id, draft)
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const {nodeDef, fetchNodeDefChildren, draft} = this.props
    const prevNodeDefId = R.path(['nodeDef', 'id'], prevProps)
    if (nodeDef.id !== prevNodeDefId)
      fetchNodeDefChildren(nodeDef.id, draft)
  }

  hasChildren () {
    const {children} = this.props
    return children.length > 0
  }

  render () {
    const {
      nodeDef,
      children,
      putNodeDefProp,

      // from parent
      edit,
      draft,
      render,
    } = this.props
    const columns = getNoColumns(nodeDef)
    const rdgLayout = getLayout(nodeDef)

    console.log('==== ')
    console.log(nodeDef)

    return (
      isRenderForm(nodeDef) && this.hasChildren() ?
        <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              rowHeight={edit ? 80 : 60}
                              autoSize={false}
                              containerPadding={edit ? [20, 50] : [20, 20]}
                              onLayoutChange={(layout) => console.log(window.innerWidth) ||
                              window.innerWidth > 1200 && layout.length > 0
                                ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
                                : null
                              }
                              layouts={{
                                lg: rdgLayout,
                                md: rdgLayout,
                                sm: rdgLayout,
                              }}
                              isDraggable={edit}
                              isResizable={edit}
                              verticalCompact={false}>

          {
            filterInnerPageChildren(children)
              .map((childDef, i) =>
                <div key={childDef.uuid}>
                  <NodeDefSwitch key={i} nodeDef={childDef} edit={edit} draft={draft} render={render}/>
                </div>
              )
          }

        </ResponsiveGridLayout>
        //TODO Render table

        : isRenderTable(nodeDef) ?

        <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              cols={{lg: 3, md: 3, sm: 3, xs: 1, xxs: 1}}
                              rowHeight={edit ? 80 : 60}
                              autoSize={false}
                              containerPadding={[0, 0]}
          // onLayoutChange={(layout) => console.log(window.innerWidth) ||
          // window.innerWidth > 1200 && layout.length > 0
          //   ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
          //   : null
          // }
          // layouts={{
          //   lg: rdgLayout,
          //   md: rdgLayout,
          //   sm: rdgLayout,
          // }}
                              isDraggable={edit}
                              isResizable={false}>

          <div key={'1'} data-grid={{w: 1, h: 1, x: 0, y: 0, i: '1'}}>1</div>
          <div key={'2'} data-grid={{w: 1, h: 1, x: 1, y: 0, i: '2'}}>2</div>
          <div key={'3'} data-grid={{w: 1, h: 1, x: 2, y: 0, i: '3'}}>3</div>


        </ResponsiveGridLayout>
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