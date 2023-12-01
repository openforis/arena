import './nodeDefText.scss'

import React from 'react'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { Input } from '@webapp/components/form/Input'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDeleteButton from '../nodeDeleteButton'

const TextInput = ({ nodeDef, readOnly, node, edit, updateNode, canEditRecord }) => {
  const multiline = NodeDef.getTextInputType(nodeDef) === NodeDef.textInputTypes.multiLine
  return (
    <div className={classNames(`survey-form__node-def-${NodeDef.getType(nodeDef)}`, { multiline })}>
      <Input
        disabled={edit || !canEditRecord || readOnly}
        numberFormat={NodeDefUIProps.getNumberFormat(nodeDef)}
        inputType={multiline ? 'textarea' : 'input'}
        textTransformFunction={NodeDef.getTextTransformFunction(nodeDef)}
        value={Node.getValue(node, '')}
        onChange={(value) => updateNode(nodeDef, node, value)}
      />
    </div>
  )
}

const MultipleTextInput = (props) => {
  const { nodeDef, parentNode, nodes, canEditRecord } = props

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
                <NodeDeleteButton nodeDef={nodeDef} node={n} showConfirm={true} />
              )}
            </div>
          )
      )}
    </div>
  )
}

const NodeDefText = (props) => {
  const { edit, entryDataQuery, nodeDef, nodes } = props

  if (edit) {
    return <TextInput {...props} />
  }
  if (NodeDef.isMultiple(nodeDef) && !entryDataQuery) {
    return <MultipleTextInput {...props} />
  }
  return <TextInput {...props} node={nodes[0]} />
}

export default NodeDefText
