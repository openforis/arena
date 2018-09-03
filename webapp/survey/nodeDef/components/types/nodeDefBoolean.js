import React from 'react'
import * as R from 'ramda'

import { getNodeValue, newNodePlaceholder } from '../../../../../common/record/record'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({nodeDef, parentNode, nodes, updateNode, label, disabled, value, edit}) => {
  const node = edit
    ? null
    : R.isEmpty(nodes)
      ? newNodePlaceholder(nodeDef, parentNode)
      : nodes[0]

  const nodeValue = getNodeValue(node, 'false')

  return (
    <button className="btn btn-s btn-transparent"
            style={{borderRadius: '.75rem'}}
            aria-disabled={disabled}
            onClick={() => updateNode(nodeDef, node, value)}>
      <span className={`icon icon-radio-${nodeValue === value ? 'checked2' : 'unchecked'} icon-left`}/>
      {label}
    </button>
  )

}

const NodeDefBoolean = props => {
  const {nodeDef, edit} = props

  return (
    <NodeDefFormItem nodeDef={nodeDef}>
      <div className="form-input" style={{borderBottom: 'none'}}>

        <Button disabled={edit}
                label="YES"
                value="true"
                {...props}/>

        <Button disabled={edit}
                label="NO"
                value="false"
                {...props}/>

      </div>
    </NodeDefFormItem>
  )

}

export default NodeDefBoolean
