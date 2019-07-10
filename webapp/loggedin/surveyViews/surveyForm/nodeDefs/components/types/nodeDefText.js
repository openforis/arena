import './nodeDefText.scss'

import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../../../../commonComponents/form/input'
import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDeleteButton from '../nodeDeleteButton'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Node from '../../../../../../../common/record/node'
import * as NodeDefUIProps from '../../nodeDefUIProps'

const TextInput = ({ nodeDef, readOnly, node, edit, updateNode, canEditRecord }) => (
  <div className={`survey-form__node-def-${NodeDef.getType(nodeDef)}`}>
    <Input
      aria-disabled={edit || !canEditRecord || readOnly}
      {...NodeDefUIProps.getNodeDefInputTextProps(nodeDef)}
      value={Node.getValue(node, '')}
      onChange={value => updateNode(nodeDef, node, value)}
    />
  </div>
)

const MultipleTextInput = props => {
  const { nodeDef, parentNode, nodes, removeNode, canEditRecord } = props

  return (
    <div>
      {
        nodes.map(n =>
          (!Node.isPlaceholder(n) || canEditRecord) &&
          <div key={Node.getUuid(n)}
               className={`survey-form__node-def-${NodeDef.getType(nodeDef)} survey-form__node-def-text-multiple-container`}>

            <NodeDefErrorBadge
              nodeDef={nodeDef}
              edit={false}
              parentNode={parentNode}
              node={n}
            />

            <TextInput {...props}
                       node={n}/>

            {
              !n.placeholder && NodeDef.isMultiple(nodeDef) && canEditRecord &&
              <NodeDeleteButton
                nodeDef={nodeDef}
                node={n}
                disabled={R.isEmpty(Node.getValue(n))}
                showConfirm={true}
                removeNode={removeNode}/>
            }

          </div>
        )
      }
    </div>
  )
}

const NodeDefText = props =>
  props.edit
    ? <TextInput {...props}/>
    : NodeDef.isMultiple(props.nodeDef)
    ? <MultipleTextInput {...props} />
    : <TextInput {...props} node={props.nodes[0]}/>

export default NodeDefText
