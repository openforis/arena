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

  nodeDefRenderType,
  isRenderForm,
  isRenderTable,
} from '../../../../../common/survey/nodeDefLayout'
import { newNodePlaceholder } from '../../../../../common/record/node'

const TableRow = (props) => {

  const {nodeDef, edit, childDefs, parentNode, renderType, label} = props

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '20px 1fr',
    }}>

      <div className="form-label" style={{justifySelf: 'center'}}>
        {label}
        </div>

      <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                            autoSize={false}
                            rowHeight={edit ? 80 : 60}
                            cols={{
                              lg: childDefs.length || 1,
                              md: childDefs.length || 1,
                              sm: childDefs.length || 1,
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
          childDefs
            .map((childDef, i) =>
              <div key={childDef.uuid} data-grid={{
                i: nodeDef.uuid, x: i, y: 0, w: 1, h: 1,
              }}>
                <NodeDefSwitch key={i}
                               {...props}
                               nodeDef={childDef}
                               parentNode={parentNode}
                               renderType={renderType}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
    </div>
  )

}

class NodeDefEntityTable extends React.Component {

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
      renderType,
    } = this.props

    const nodesToRender = entry ? R.concat(nodes, [newNodePlaceholder(nodeDef, parentNode)]) : null

    return (
      <React.Fragment>

        <TableRow {...this.props} parentNode={null} renderType={nodeDefRenderType.tableHeader}/>

        {
          entry
            ? nodesToRender.map(node =>
              <TableRow {...this.props} parentNode={node} renderType={nodeDefRenderType.tableBody}/>
            )
            : null
        }

      </React.Fragment>
    )
  }
}

export default NodeDefEntityTable