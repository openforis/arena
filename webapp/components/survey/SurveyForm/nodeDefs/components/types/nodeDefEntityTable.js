import './nodeDefEntityTable.scss'
import React from 'react'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { DataTestId } from '@webapp/utils/dataTestId'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefEntityTableRows from './nodeDefEntityTableRows'

const NodeDefEntityTable = (props) => {
  const { entry, edit, nodeDef, nodes, parentNode, label, updateNode, canEditRecord, canAddNode } = props

  return (
    <div className="survey-form__node-def-entity-table">
      <div className="survey-form__node-def-entity-table-header">
        <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
          <div>{label}</div>

          {entry && canEditRecord && (
            <button
              aria-disabled={!canAddNode}
              className="btn btn-xs btn-add"
              data-testid={DataTestId.surveyForm.entityAddBtn(NodeDef.getName(nodeDef))}
              onClick={() => {
                const entity = Node.newNodePlaceholder(nodeDef, parentNode)
                updateNode(nodeDef, entity)
              }}
              type="button"
            >
              <span className="icon icon-plus icon-10px" />
            </button>
          )}
        </NodeDefErrorBadge>
      </div>

      <NodeDefEntityTableRows {...props} />
    </div>
  )
}

export default NodeDefEntityTable
