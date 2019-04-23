import '../../../react-grid-layout.scss'

import React from 'react'
import * as R from 'ramda'

import { nodeDefRenderType } from '../../../../../../../common/survey/nodeDefLayout'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Node from '../../../../../../../common/record/node'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'

class NodeDefEntityTable extends React.Component {

  componentDidUpdate (prevProps) {
    const { nodes, nodeDef } = this.props
    const { nodes: prevNodes } = prevProps

    if (nodes && !R.isEmpty(nodes) && nodes.length !== prevNodes.length) {
      const element = document.getElementById(`${NodeDef.getUuid(nodeDef)}_${nodes.length - 1}`)
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
      canEditRecord,
      canAddNode,
    } = this.props

    return (
      <div className="node-def__table">

        <div className="node-def__table-header">
          <div>{label}</div>
          {
            entry && canEditRecord
              ? <button className="btn btn-s btn-of-light-xs"
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          const entity = Node.newNodePlaceholder(nodeDef, parentNode)
                          updateNode(nodeDef, entity)
                        }}
                        aria-disabled={!canAddNode}>
                <span className="icon icon-plus icon-12px icon-left"/>
                ADD
              </button>
              : null
          }
        </div>


        <div className="node-def__table-rows">
          {
            edit || !R.isEmpty(nodes)
              ? <NodeDefEntityTableRow {...this.props}
                                       node={null}
                                       renderType={nodeDefRenderType.tableHeader}/>
              : null
          }

          {
            entry
              ? R.isEmpty(nodes)
                ? <h5><i>No data added</i></h5>
                : (
                  <div className="node-def__table-data-rows">
                    {nodes.map((node, i) =>
                      <NodeDefEntityTableRow key={i}
                                             i={i}
                                             {...this.props}
                                             node={node}
                                             nodes={null}
                                             renderType={nodeDefRenderType.tableBody}/>
                    )}
                  </div>
                )
              : null
          }
        </div>
      </div>
    )
  }
}

export default NodeDefEntityTable