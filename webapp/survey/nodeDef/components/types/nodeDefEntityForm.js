import '../react-grid-layout.scss'

import React from 'react'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../../common/survey/nodeDefLayout'

class NodeDefEntityForm extends React.Component {

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
      childDefs.length > 0 ?
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
                              onLayoutChange={() => this.onLayoutChange()}
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

        : null
    )
  }
}

export default NodeDefEntityForm