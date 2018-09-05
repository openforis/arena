import '../react-grid-layout.scss'

import React from 'react'

import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import { newNodePlaceholder } from '../../../../../common/record/node'

const EntityTableRow = (props) => {

  const {nodeDef, edit, childDefs, node, renderType, label, removeNode} = props

  return (

    <React.Fragment>
      {
        renderType === nodeDefRenderType.tableHeader ?
          <div className="form-label" style={{justifySelf: 'center'}}>
            {label}
          </div>
          : null
      }


      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 20px'
      }}>

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
                                 node={null}
                                 nodeDef={childDef}
                                 parentNode={node}
                                 renderType={renderType}/>
                </div>
              )
          }

        </ResponsiveGridLayout>

        {
          renderType === nodeDefRenderType.tableBody && !node.placeholder ?
            <button className="btn btn-s btn-of-light-xs"
                    style={{
                      alignSelf: 'center',
                      justifySelf: 'center',
                    }}
                    onClick={() =>
                      window.confirm('Are you sure you want to delete this entity?')
                        ? removeNode(nodeDef, node)
                        : null
                    }>
              <span className="icon icon-bin icon-12px"/>
            </button>

            : null
        }
      </div>

    </React.Fragment>
  )

}

class NodeDefEntityTable extends React.Component {

  render () {
    const {
      nodeDef,
      entry,
      parentNode,
      nodes,
    } = this.props

    return (
      <React.Fragment>

        <EntityTableRow {...this.props}
                        node={null}
                        renderType={nodeDefRenderType.tableHeader}/>
        {
          entry ?
            R.pipe(
              R.append(newNodePlaceholder(nodeDef, parentNode)),
              R.addIndex(R.map)(
                (node, i) =>
                  <EntityTableRow key={i}
                                  {...this.props}
                                  node={node}
                                  renderType={nodeDefRenderType.tableBody}/>
              )
            )(nodes)
            : null
        }

      </React.Fragment>
    )
  }
}

export default NodeDefEntityTable