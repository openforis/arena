import '../../../react-grid-layout.scss'

import React, { useEffect } from 'react'
import * as R from 'ramda'

import useI18n from '../../../../../../commonComponents/useI18n'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'
import Node from '../../../../../../../common/record/node'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'

const NodeDefEntityTable = props => {

  const {
    entry, edit,
    nodeDef, nodes, parentNode, label,
    updateNode,
    canEditRecord, canAddNode,
  } = props

  const i18n = useI18n()

  useEffect(() => {
    if (!R.isEmpty(nodes)) {
      const element = document.getElementById(`${NodeDef.getUuid(nodeDef)}_${nodes.length - 1}`)
      element.scrollIntoView()
    }
  }, [nodes && nodes.length])

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
              {i18n.t('common.add')}
            </button>
            : null
        }
      </div>


      <div className="node-def__table-rows">
        {
          (edit || !R.isEmpty(nodes)) &&
          <NodeDefEntityTableRow
            {...props}
            node={null}
            renderType={NodeDefLayout.nodeDefRenderType.tableHeader}/>
        }

        {
          entry &&
          R.isEmpty(nodes)
            ? (
              <h5>
                <i>{i18n.t('surveyForm.nodeDefEntityTable.noDataAdded')}</i>
              </h5>
            )
            : (
              <div className="node-def__table-data-rows">
                {
                  nodes.map((node, i) =>
                    <NodeDefEntityTableRow
                      key={i}
                      i={i}
                      {...props}
                      node={node}
                      nodes={null}
                      renderType={NodeDefLayout.nodeDefRenderType.tableBody}/>
                  )
                }
              </div>
            )
        }
      </div>
    </div>
  )
}

export default NodeDefEntityTable