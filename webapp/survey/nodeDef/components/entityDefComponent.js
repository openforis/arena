import './react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitchComponent from './nodeDefSwitchComponent'

const ResponsiveGridLayout = WidthProvider(Responsive)

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../common/survey/nodeDefLayout'

import { getNodeDefChildren, getSurveyState } from '../../surveyState'

import { fetchNodeDefChildren, putNodeDefProp, } from '../actions'

class EntityDefComponent extends React.Component {

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

    return (
      this.hasChildren() ?
        //TODO ? isRenderForm(nodeDef)
        <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              rowHeight={60}
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
                              isResizable={edit}>

          {
            filterInnerPageChildren(children)
              .map((childDef, i) =>
                <div key={childDef.uuid}>
                  <NodeDefSwitchComponent key={i} nodeDef={childDef} edit={edit} draft={draft} render={render}/>
                </div>
              )
          }

        </ResponsiveGridLayout>
        //TODO Render table
        // : '=P'
        : null
    )
  }
}

EntityDefComponent.defaultProps = {
  entityDef: {},
  draft: false,
  edit: false,
}

const mapStateToProps = (state, props) => ({
  children: getNodeDefChildren(props.nodeDef)(getSurveyState(state)),
})

export default connect(mapStateToProps, {putNodeDefProp, fetchNodeDefChildren})(EntityDefComponent)