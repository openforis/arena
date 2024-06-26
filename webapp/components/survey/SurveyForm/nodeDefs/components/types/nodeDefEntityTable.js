import './nodeDefEntityTable.scss'
import React from 'react'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { TestId } from '@webapp/utils/testId'

import { ButtonIconAdd } from '@webapp/components'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'
import NodeDefEntityTableRows from './nodeDefEntityTableRows'

const NodeDefEntityTable = (props) => {
  const { entry, edit, lang, nodeDef, nodes, parentNode, label, updateNode, canEditRecord, canAddNode } = props

  return (
    <div className="survey-form__node-def-entity-table">
      <div className="survey-form__node-def-entity-table-header">
        <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
          <div className="label-wrapper">
            {label}
            <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
          </div>

          {entry && canEditRecord && !NodeDef.isEnumerate(nodeDef) && (
            <ButtonIconAdd
              disabled={!canAddNode}
              onClick={() => {
                const entity = Node.newNodePlaceholder(nodeDef, parentNode)
                updateNode(nodeDef, entity)
              }}
              testId={TestId.surveyForm.entityAddBtn(NodeDef.getName(nodeDef))}
            />
          )}
        </NodeDefErrorBadge>
      </div>

      <NodeDefEntityTableRows {...props} />
    </div>
  )
}

export default NodeDefEntityTable
