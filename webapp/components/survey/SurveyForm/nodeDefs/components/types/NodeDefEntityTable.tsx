import './NodeDefEntityTable.scss'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import { ButtonIconAdd } from '@webapp/components'
import { TestId } from '@webapp/utils/testId'
import NodeDefErrorBadge from '../NodeDefErrorBadge'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'

import NodeDefEntityTableRows from './NodeDefEntityTableRows'

const NodeDefEntityTable = (props) => {
  const { edit, lang, nodeDef, nodes, parentNode, label, updateNode, canAddNode } = props

  return (
    <div className="survey-form__node-def-entity-table">
      <div className="survey-form__node-def-entity-table-header">
        <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
          <div className="label-wrapper">
            {label}
            <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
          </div>

          {canAddNode && (
            <ButtonIconAdd
              iconSize={20}
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
