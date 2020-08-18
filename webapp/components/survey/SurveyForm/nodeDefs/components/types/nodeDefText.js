import './nodeDefText.scss'

import React from 'react'

import { Input } from '@webapp/components/form/Input'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDeleteButton from '../nodeDeleteButton'

import * as NodeDefUIProps from '../../nodeDefUIProps'

const TextInput = ({ nodeDef, readOnly, node, edit, updateNode, canEditRecord }) => (
  <div className={`survey-form__node-def-${NodeDef.getType(nodeDef)}`}>
    <Input
      disabled={edit || !canEditRecord || readOnly}
      numberFormat={NodeDefUIProps.getNumberFormat(nodeDef)}
      value={Node.getValue(node, '')}
      onChange={(value) => updateNode(nodeDef, node, value)}
    />
  </div>
)

const MultipleTextInput = (props) => {
  const { nodeDef, parentNode, nodes, removeNode, canEditRecord } = props

  return (
    <div>
      {nodes.map(
        (n) =>
          (!Node.isPlaceholder(n) || canEditRecord) && (
            <div
              key={Node.getUuid(n)}
              className={`survey-form__node-def-${NodeDef.getType(
                nodeDef
              )} survey-form__node-def-text-multiple-container`}
            >
              <NodeDefErrorBadge nodeDef={nodeDef} edit={false} parentNode={parentNode} node={n} />

              <TextInput {...props} node={n} />

              {!n.placeholder && NodeDef.isMultiple(nodeDef) && canEditRecord && (
                <NodeDeleteButton nodeDef={nodeDef} node={n} showConfirm={true} removeNode={removeNode} />
              )}
            </div>
          )
      )}
    </div>
  )
}

const NodeDefText = (props) => {
  const { edit, entryDataQuery, nodeDef, nodes } = props

  return edit ? (
    <TextInput {...props} />
  ) : NodeDef.isMultiple(nodeDef) && !entryDataQuery ? (
    <MultipleTextInput {...props} />
  ) : (
    <TextInput {...props} node={nodes[0]} />
  )
}

export default NodeDefText
