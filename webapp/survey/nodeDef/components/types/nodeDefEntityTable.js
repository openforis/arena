import '../react-grid-layout.scss'

import React from 'react'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import { getNodeDefFieldsCount } from '../nodeDefSystemProps'
import { elementOffset } from '../../../../appUtils/domUtils'

import { newNode } from '../../../../../common/record/node'

const rowHeight = 50

const EntityTableRow = (props) => {

  const {
    nodeDef, childDefs, node,
    renderType,
    removeNode,
    i = 'header',
  } = props

  const childDefsLayout = R.reduce(
    (layout, childDef) => {
      const count = getNodeDefFieldsCount(childDef)
      const {columns} = layout
      return R.pipe(
        R.assoc('columns', columns + count),
        R.assoc(
          childDef.uuid,
          {i: childDef.uuid, w: count, x: columns, y: 0, h: 1,}
        )
      )(layout)
    },
    {columns: 0},
    childDefs
  )
  const {columns} = childDefsLayout

  return (
    <div className="node-def__table-row" id={`${nodeDef.uuid}_${i}`}>

      <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                            autoSize={false}
                            rowHeight={rowHeight - 1}
                            cols={{
                              lg: columns || 1,
                              md: columns || 1,
                              sm: columns || 1,
                              xs: 1,
                              xxs: 1
                            }}
                            containerPadding={[0, 0]}
        // layouts={{}}
        //                     onLayoutChange={this.onLayoutChange}
        //                     isDraggable={edit && !locked}
                            isDraggable={false}
                            isResizable={false}
                            compactType={'horizontal'}
                            margin={[0, 0]}>
        {
          childDefs
            .map((childDef, i) => {
                const childDefLayout = R.prop(childDef.uuid, childDefsLayout)

                return <div key={childDef.uuid} data-grid={{...childDefLayout}}>
                  <NodeDefSwitch key={i}
                                 {...props}
                                 node={null}
                                 nodeDef={childDef}
                                 parentNode={node}
                                 renderType={renderType}/>
                </div>
              }
            )
        }

      </ResponsiveGridLayout>

      {
        renderType === nodeDefRenderType.tableBody ?
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
  )

}

class NodeDefEntityTable extends React.Component {

  componentDidUpdate (prevProps) {
    const {nodes, nodeDef} = this.props
    const {nodes: prevNodes} = prevProps

    if (!R.isEmpty(nodes) && nodes.length !== prevNodes.length) {
      const element = document.getElementById(`${nodeDef.uuid}_${nodes.length - 1}`)
      element.scrollIntoView()
    }
  }

  render () {
    const {
      entry,
      edit,
      nodeDef,
      nodes,
      parentNode,
      label,
      updateNode,
    } = this.props

    const domElem = document.getElementById(nodeDef.uuid)
    const {height} = domElem ? elementOffset(domElem) : {height: 80}

    return (
      <div className="node-def__table">

        <div className="node-def__table-header">
          <h5>{label}</h5>
          {
            entry
              ? <button className="btn btn-s btn-of-light-xs"
                        style={{marginLeft: '10px'}}
                        onClick={() => {
                          const entity = newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
                          updateNode(nodeDef, entity)
                        }}>
                <span className="icon icon-plus icon-12px icon-left"></span>
                ADD
              </button>
              : null
          }
        </div>

        {
          edit || !R.isEmpty(nodes) ?

            <EntityTableRow {...this.props}
                            node={null}
                            renderType={nodeDefRenderType.tableHeader}/>
            : null
        }

        {
          entry ?
            R.isEmpty(nodes)
              ? <h5><i>No data added</i></h5>
              : <div className="node-def__table-data-rows"
                     style={{
                       gridTemplateRows: `repeat(${nodes.length}, ${rowHeight}px)`,
                       maxHeight: height - 80,
                     }}>
                {
                  nodes.map((node, i) =>
                    <EntityTableRow key={i}
                                    i={i}
                                    {...this.props}
                                    node={node}
                                    nodes={null}
                                    renderType={nodeDefRenderType.tableBody}/>
                  )
                }
              </div>
            : null
        }

      </div>
    )
  }
}

export default NodeDefEntityTable